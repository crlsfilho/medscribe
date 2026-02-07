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

const NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

async function fetchPubmed(query: string): Promise<Article[]> {
    try {
        // 1. Search for recent free full text articles
        const esearchUrl = `${NCBI_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
            query + " AND free full text[sb]"
        )}&retmode=json&retmax=3&sort=date`; // Sort by date for new articles

        const searchRes = await fetch(esearchUrl, { next: { revalidate: 3600 } });
        const searchData = await searchRes.json();
        const ids = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) return [];

        // 2. Get details
        const esummaryUrl = `${NCBI_BASE_URL}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
        const summaryRes = await fetch(esummaryUrl, { next: { revalidate: 3600 } });
        const summaryData = await summaryRes.json();
        const result = summaryData.result || {};

        return ids.map((id: string) => {
            const doc = result[id];
            if (!doc) return null;

            return {
                title: doc.title,
                description: doc.source || "PubMed Article",
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                source: { name: "PubMed/Cardio" },
                publishedAt: doc.sortpubdate || doc.pubdate
            };
        }).filter(Boolean) as Article[];

    } catch (error) {
        console.error("Error fetching PubMed:", error);
        return [];
    }
}

export async function GET() {
    // 1. Ministério da Saúde RSS
    const minSaudeFeed = "https://news.google.com/rss/search?q=site:gov.br/saude+when:14d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

    // 2. Google News: Cardiology (Scientific/Official sources)
    const cardiologiaFeed = "https://news.google.com/rss/search?q=cardiologia+site:sbc.org.br+OR+site:scielo.br+OR+site:arquivosonline.com.br+when:30d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

    const [cardioNews, govNews, pubmedNews] = await Promise.all([
        fetchRSS(cardiologiaFeed, "SBC/Cardio"),
        fetchRSS(minSaudeFeed, "Min. Saúde"),
        fetchPubmed("cardiology") // New source
    ]);

    // Interleave news for variety
    const articles = [];
    const maxLength = Math.max(cardioNews.length, govNews.length, pubmedNews.length);

    for (let i = 0; i < maxLength; i++) {
        if (pubmedNews[i]) articles.push(pubmedNews[i]); // Priority to new source
        if (govNews[i]) articles.push(govNews[i]);
        if (cardioNews[i]) articles.push(cardioNews[i]);
    }

    return NextResponse.json({
        articles: articles.slice(0, 7), // Increased limit slightly
        source: "rss_custom_mixed"
    });
}
