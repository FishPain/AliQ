import * as z from "zod";

export const formSchema = z.object({
    prompt: z.string().min(1, {
        message: "Prompt is required",
    }),
    // Image is an array of File objects
    image: z
        .array(
            z.instanceof(File).refine((file) => file.size > 0, {
                message: "Image is required",
            })
        )
});
