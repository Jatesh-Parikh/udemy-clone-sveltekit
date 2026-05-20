import { getCourses } from "$lib/actions/getCourses";
import type { Category } from "$lib/types";

export const load = async ({ locals: { pb, user }, url }) => {
    const categoryId = url.searchParams.get('categoryId') || '';
    const userId = user?.id;
    const title = url.searchParams.get('title') || '';

    function getCategories() {
        const categories = pb.collection('categories').getFullList<Category>({
            sort: '-created'
        });
        return categories;
    }

    const [categories, courses] = await Promise.all([
        getCategories(),
        getCourses({ categoryId, pb, title, userId })
    ]);

    console.log("Load courses:", courses);

    return {
        categories,
        courses
    }
}
