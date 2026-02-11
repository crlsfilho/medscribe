import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TUSS_CSV_URL = "https://raw.githubusercontent.com/charlesfgarcia/tabelas-ans/master/TUSS/tabela%2022/Tabela%2022%20-%20Terminologia%20de%20procedimentos%20e%20eventos%20em%20saude.csv";

export async function syncTussCodes() {
    console.log("Starting TUSS sync...");

    try {
        const response = await fetch(TUSS_CSV_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch TUSS CSV: ${response.statusText}`);
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Skip header
        // Header: Código do Termo;Termo;Data de início de vigência;Data de fim de vigência;Data de fim de implantação
        const startIndex = lines[0].startsWith('Código') || lines[0].startsWith('\uFEFFCódigo') ? 1 : 0;

        let processed = 0;
        let created = 0;
        let updated = 0;

        // Process in chunks to avoid memory issues
        const CHUNK_SIZE = 100;
        let currentBatch: any[] = [];

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(';');
            if (parts.length < 2) continue;

            const code = parts[0].trim();
            const description = parts[1].trim();
            const endDateVigencia = parts[3]?.trim();

            // Filter active codes: End Date must be empty or in the future
            if (endDateVigencia) {
                // Parse DD/MM/YYYY
                const [day, month, year] = endDateVigencia.split('/').map(Number);
                const end = new Date(year, month - 1, day);
                if (end < new Date()) {
                    continue; // Expired
                }
            }

            currentBatch.push({
                code,
                description,
                table: "22", // Procedimentos
                category: "Imported"
            });

            if (currentBatch.length >= CHUNK_SIZE) {
                await processBatch(currentBatch);
                processed += currentBatch.length;
                currentBatch = [];
            }
        }

        // Process remaining
        if (currentBatch.length > 0) {
            await processBatch(currentBatch);
            processed += currentBatch.length;
        }

        console.log(`TUSS Sync Complete. Processed: ${processed}`);
        return { success: true, processed };

    } catch (error) {
        console.error("Error syncing TUSS codes:", error);
        throw error;
    }
}

async function processBatch(batch: any[]) {
    // Use transaction for the batch could be too heavy if many upserts, 
    // but Prisma upsert one by one is safe.
    // Ideally we would use createMany but we want to update descriptions if they changed.
    // For simplicity and safety, we loop upsert. Efficiency: parallel Promise.all 

    await Promise.all(batch.map(item =>
        prisma.tussCode.upsert({
            where: { code: item.code },
            create: item,
            update: {
                description: item.description,
                // Don't overwrite category if it was customized manually? 
                // schema says category is String? 
                // Let's perform a simple update description for now.
            }
        })
    ));
}
