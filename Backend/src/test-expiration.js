const prisma = require("./config/db.config.js");

async function main() {
    const now = new Date();

    console.log("Current application time:", now.toISOString());

    const expiredLinks = await prisma.link.findMany({
        where: {
            expiresAt: {
                lte: now
            }
        },
        select: {
            id: true,
            slug: true,
            expiresAt: true
        }
    });

    console.log("Expired links visible to Prisma:", expiredLinks);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });