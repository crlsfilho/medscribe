import { NextResponse } from "next/server";

interface Article {
    title: string;
    description: string;
    url: string;
    source: { name: string };
    publishedAt: string;
}

async function fetchRSS(url: string, sourceName: string): Promise<Article[]> {
    try {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const xml = await response.text();

        // Simple Regex Parser for RSS items
        // Extract <item> blocks
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        return items.slice(0, 3).map(item => {
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
            const linkMatch = item.match(/<link>(.*?)<\/link>/);
            const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
            const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/); // Allow multiline description

            let cleanDesc = descMatch ? descMatch[1] : "";
            // Remove HTML tags and entities
            cleanDesc = cleanDesc
                .replace(/&lt;.*?&gt;/g, "") // Remove encoded tags <...>
                .replace(/<[^>]*>?/gm, "")   // Remove normal tags
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, '"')
                .trim();

            // Truncate
            if (cleanDesc.length > 100) cleanDesc = cleanDesc.slice(0, 100) + "...";

            return {
                title: titleMatch ? titleMatch[1] : "Sem título",
                description: cleanDesc,
                url: linkMatch ? linkMatch[1] : "#",
                source: { name: sourceName },
                publishedAt: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
            };
        });
    } catch (err) {
        console.error(`Error fetching RSS from ${sourceName}:`, err);
        return [];
    }
}

export async function GET() {
    // 1. Ministério da Saúde RSS (Direct via Google News to ensure stability)
    // 2. Google News: Cardiology (Scientific/Official sources) - Last 30 days
    const cardiologiaFeed = "https://news.google.com/rss/search?q=cardiologia+site:sbc.org.br+OR+site:scielo.br+OR+site:arquivosonline.com.br+when:30d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

    // 3. Google News: Ministry of Health (Official) - Last 14 days
    const minSaudeFeed = "https://news.google.com/rss/search?q=site:gov.br/saude+when:14d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

    const [cardioNews, govNews] = await Promise.all([
        fetchRSS(cardiologiaFeed, "Cardiologia/SBC"),
        fetchRSS(minSaudeFeed, "Min. Saúde")
    ]);

    // Interleave news for variety
    const articles = [];
    const maxLength = Math.max(cardioNews.length, govNews.length);
    for (let i = 0; i < maxLength; i++) {
        if (govNews[i]) articles.push(govNews[i]);
        if (cardioNews[i]) articles.push(cardioNews[i]);
    }

    return NextResponse.json({
        articles: articles.slice(0, 5),
        source: "rss_custom"
    });
}
