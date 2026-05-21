import { chapterAccessSchema, chapterDescriptionSchema, chapterTitleSchema } from '$lib/schema.js';
import type { Chapter, Course, MuxData } from '$lib/types';
import { error, fail, redirect } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { message, superValidate } from 'sveltekit-superforms/server';
import Mux from '@mux/mux-node';
import { MUX_TOKEN_ID, MUX_TOKEN_SECRET } from '$env/static/private';
import { zod } from 'sveltekit-superforms/adapters';
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

export const load = async ({ params, locals: { pb } }) => {
	const chapterId = params.chapterId;
	async function getChapter() {
		try {
			const chapter = await pb.collection('chapters').getOne<Chapter>(chapterId, {
				expand: 'muxData(chapterId)'
			});
			if (chapter.videoUrl) {
				const videoUrl = pb.files.getUrl(chapter, chapter.videoUrl);
				chapter.videoUrl = videoUrl;
			}
			return chapter;
		} catch (e) {
			const { status } = e as ClientResponseError;

			if (status === 404) error(404, 'Course does not exist');
			redirect(308, '/');
		}
	}
	const chapter = await getChapter();
	const chapterTitleForm = await superValidate(chapter, zod(chapterTitleSchema));
	const chapterDescriptionForm = await superValidate(chapter, zod(chapterDescriptionSchema));
	const chapterAccessForm = await superValidate(chapter, zod(chapterAccessSchema));

	return {
		chapter,
		chapterTitleForm,
		chapterDescriptionForm,
		chapterAccessForm
	};
};

export const actions = {
    updateTitle: async (event) => {
		const { locals: { pb }, params } = event;
		const { chapterId } = params;

		const form = await superValidate(event, zod(chapterTitleSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await pb.collection('chapters').update(chapterId, form.data);
			return message(form, 'successfully updated chapter title');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
    updateDescription: async (event) => {
		const { locals: { pb }, params } = event;
		const { chapterId } = params;

		const form = await superValidate(event, zod(chapterDescriptionSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			await pb.collection('chapters').update(chapterId, form.data);
			return message(form, 'Successfully updated chapter description');
		} catch (e) {
			const { message: errorMessage } = e as ClientResponseError;

			return message(form, errorMessage, { status: 400 });
		}
	},
};
