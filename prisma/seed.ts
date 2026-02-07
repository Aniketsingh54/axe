import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'user_39JitzH9KRANo9OHDCjr05eWiob'; // Found existing user

    const workflowName = 'Product Marketing Kit Generator';

    // Define nodes
    const nodes = [
        // Branch A
        { id: 'img-upload', type: 'upload-image', position: { x: 50, y: 50 }, data: { title: 'Upload Product Photo' } },
        { id: 'img-crop', type: 'crop-image', position: { x: 350, y: 50 }, data: { x_percent: 10, y_percent: 10, width_percent: 80, height_percent: 80 } },
        { id: 'text-sys', type: 'text', position: { x: 50, y: 200 }, data: { text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.' } },
        { id: 'text-details', type: 'text', position: { x: 50, y: 350 }, data: { text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.' } },
        { id: 'llm-1', type: 'llm', position: { x: 650, y: 150 }, data: { model: 'gemini-1.5-flash', title: 'Branch A: Product Description' } },

        // Branch B
        { id: 'vid-upload', type: 'upload-video', position: { x: 50, y: 550 }, data: { title: 'Upload Demo Video' } },
        { id: 'frame-extract', type: 'extract-frame', position: { x: 350, y: 550 }, data: { timestamp: '50%' } },

        // Convergence
        { id: 'text-sm', type: 'text', position: { x: 650, y: 450 }, data: { text: 'You are a social media manager. Create a tweet-length marketing post based on the product image and video frame.' } },
        { id: 'llm-2', type: 'llm', position: { x: 950, y: 300 }, data: { model: 'gemini-1.5-flash', title: 'Final Marketing Post' } }
    ];

    // Define edges
    const edges = [
        // Branch A
        { id: 'e-img-1', source: 'img-upload', target: 'img-crop', targetHandle: 'image_url' },
        { id: 'e-img-2', source: 'img-crop', target: 'llm-1', targetHandle: 'images' },
        { id: 'e-text-1', source: 'text-sys', target: 'llm-1', targetHandle: 'system_prompt' },
        { id: 'e-text-2', source: 'text-details', target: 'llm-1', targetHandle: 'user_message' },

        // Branch B
        { id: 'e-vid-1', source: 'vid-upload', target: 'frame-extract', targetHandle: 'video_url' },

        // Convergence
        { id: 'e-llm-1-2', source: 'llm-1', target: 'llm-2', targetHandle: 'user_message' },
        { id: 'e-text-sm', source: 'text-sm', target: 'llm-2', targetHandle: 'system_prompt' },
        { id: 'e-img-crop-final', source: 'img-crop', target: 'llm-2', targetHandle: 'images' },
        { id: 'e-frame-extract-final', source: 'frame-extract', target: 'llm-2', targetHandle: 'images' }
    ];

    console.log(`Seeding workflow: ${workflowName}...`);

    await prisma.workflow.upsert({
        where: { id: 'sample-workflow-market-kit' },
        update: {
            name: workflowName,
            nodes,
            edges,
        },
        create: {
            id: 'sample-workflow-market-kit',
            userId,
            name: workflowName,
            nodes,
            edges,
        },
    });

    console.log('Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
