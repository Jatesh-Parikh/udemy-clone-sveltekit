import { type Attachment, type Category, type Chapter, type Course } from '$lib/types';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { ClientResponseError } from 'pocketbase';
import {
	categorySchema,
	chapterTitleSchema,
	descriptionSchema,
	priceSchema,
	titleSchema
} from '$lib/schema.js';
import Mux from '@mux/mux-node';
import { MUX_TOKEN_ID, MUX_TOKEN_SECRET } from '$env/static/private';
import { zod } from 'sveltekit-superforms/adapters';
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

export const load = async ({ params, locals: { pb, user } }) => {
	const { courseId } = params;
	const userId = user?.id;
	if (!userId) {
		redirect(308, '/');
	}
	async function getCourse() {
		try {
			const course = await pb.collection('courses').getOne<Course>(courseId, {
				expand: 'category, attachments(course), chapters(course)'
			});
			if (course.imageUrl) {
				const imageUrl = pb.files.getUrl(course, course.imageUrl);
				course.imageUrl = imageUrl;
			}
			return course;
		} catch (e) {
			const { status } = e as ClientResponseError;

			if (status === 404) error(400, 'course does not exist');
			redirect(308, '/');
		}
	}
	async function getCategories() {
		try {
			const categories = await pb.collection('categories').getFullList<Category>({
				sort: '-created'
			});
			return categories;
		} catch (e) {
			const { status } = e as ClientResponseError;

			if (status === 404) redirect(308, '/');
			error(400, 'an error occurred');
		}
	}

	const [course, categories] = await Promise.all([getCourse(), getCategories()]);
	const titleForm = await superValidate(course, zod(titleSchema));
	const descriptionForm = await superValidate(course, zod(descriptionSchema));
	const categoryForm = await superValidate(course, zod(categorySchema));
	const priceForm = await superValidate(course, zod(priceSchema));
	const chapterTitleForm = await superValidate(zod(chapterTitleSchema), { id: 'chapterTitleForm' });

	return {
		course,
		categories,
		titleForm,
		descriptionForm,
		categoryForm,
		priceForm,
		chapterTitleForm
	};
};

export const actions = {
    updateTitle: async (event) => {
		const { locals: { pb }, params } = event;
		const { courseId } = params;

		const form = await superValidate(event, zod(titleSchema));
		
        if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await pb.collection('courses').update(courseId, form.data);
			return message(form, 'Successfully updated course title');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
    updateDescription: async (event) => {
		const { locals: { pb }, params } = event;
		const { courseId } = params;

		const form = await superValidate(event, zod(descriptionSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await pb.collection('courses').update(courseId, form.data);
			return message(form, 'Successfully updated course description');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
	updateImage: async (event) => {
		const { locals: { pb }, params, request } = event;
		const { courseId } = params;

		const formData = await request.formData();

		const image = formData.get('image');

		if (image instanceof File) {
			try {
				await pb.collection('courses').update(courseId, { imageUrl: image });
				return { message: 'Successfully updated course image' };
			} catch (e) {
				const { message: errorMessage } = e as ClientResponseError;

				return fail(400, { message: errorMessage });
			}
		} else {
			return fail(400, { message: 'Invalid file format' });
		}
	},
	updateCategory: async (event) => {
		const { locals: { pb }, params } = event;
		const { courseId } = params;

		const form = await superValidate(event, zod(categorySchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await pb.collection('courses').update(courseId, form.data);
			return message(form, 'Successfully updated course category');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
	updatePrice: async (event) => {
		const { locals: { pb }, params } = event;
		const { courseId } = params;

		const form = await superValidate(event, zod(priceSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await pb.collection('courses').update(courseId, form.data);
			return message(form, 'Successfully updated course price');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
	createAttachment: async (event) => {
		const { locals: { pb }, params, request } = event;
		const { courseId } = params;

		const formData = await request.formData();

		const file = formData.get('file');

		try {
			await pb.collection('attachments').create({
				name: 'whatever',
				course: courseId,
				url: file
			});
			return { message: 'Successfully added course attachment' };
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return fail(400, { message: errorMessage });
		}
	},
	deleteAttachment: async (event) => {
		const { locals: { pb }, request } = event;

		const formData = await request.formData();

		const id = formData.get('id') as string;

		try {
			await pb.collection('attachments').delete(id);

			return { message: 'Successfully deleted course attachment' };
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return fail(400, { message: errorMessage });
		}
	},
	createChapter: async (event) => {
		const { locals: { pb }, params } = event;
		const { courseId } = params;

		const form = await superValidate(event, zod(chapterTitleSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		let lastChapter: Chapter | null = null;

		try {
			lastChapter = await pb
				.collection('chapters')
				.getFirstListItem<Chapter>(`course="${courseId}"`, {
					sort: '-position'
				});
		} catch {
			lastChapter = null;
		}

		try {
			const newPosition = lastChapter ? lastChapter.position + 1 : 1;
			await pb.collection('chapters').create({
				title: form.data.title,
				course: courseId,
				position: newPosition
			});
			return message(form, 'Successfully added course chapter');
		} catch (e) {
			console.log('createChapter error', e);
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
};