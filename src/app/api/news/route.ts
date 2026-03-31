import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

async function fetchPubmed(query: string, specialtyName: string): Promise<Article[]> {
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
                source: { name: `PubMed/${specialtyName}` },
                publishedAt: doc.sortpubdate || doc.pubdate
            };
        }).filter(Boolean) as Article[];

    } catch (error) {
        console.error("Error fetching PubMed:", error);
        return [];
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    let specialty = "medicina";

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { specialty: true }
        });
        if (user?.specialty) {
            specialty = user.specialty.toLowerCase();
        }
    }

    // Map specialty to English for PubMed and specific Portuguese terms for Google News
    const pubmedQueries: Record<string, string> = {
        "cardiologia": "cardiology",
        "dermatologia": "dermatology",
        "pediatria": "pediatrics",
        "psiquiatria": "psychiatry",
        "neurologia": "neurology",
        "ginecologia": "gynecology",
        "ortopedia": "orthopedics",
        "endocrinologia": "endocrinology",
        "gastroenterologia": "gastroenterology",
        "urologia": "urology",
        "clínica geral": "internal medicine",
    };

    const pubmedTerm = pubmedQueries[specialty] || "medicine";
    
    // 1. Ministério da Saúde RSS (Global News)
    const minSaudeFeed = "https://news.google.com/rss/search?q=site:gov.br/saude+when:14d&hl=pt-BR&gl=BR&ceid=BR:pt-419";

    // 2. Google News: Specific area
    const googleQuery = encodeURIComponent(`${specialty} site:sbc.org.br OR site:scielo.br OR site:arquivosonline.com.br`);
    const specialtyFeed = `https://news.google.com/rss/search?q=${googleQuery}+when:30d&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const formattedSpecialty = specialty.charAt(0).toUpperCase() + specialty.slice(1);

    const [specialtyNews, govNews, pubmedNews] = await Promise.all([
        fetchRSS(specialtyFeed, `SciELO / BR (${formattedSpecialty})`),
        fetchRSS(minSaudeFeed, "Min. Saúde"),
        fetchPubmed(pubmedTerm, formattedSpecialty)
    ]);

    // Interleave news for variety
    const articles = [];
    const maxLength = Math.max(specialtyNews.length, govNews.length, pubmedNews.length);

    for (let i = 0; i < maxLength; i++) {
        if (pubmedNews[i]) articles.push(pubmedNews[i]);
        if (govNews[i]) articles.push(govNews[i]);
        if (specialtyNews[i]) articles.push(specialtyNews[i]);
    }

    return NextResponse.json({
        articles: articles.slice(0, 10), 
        source: "rss_custom_mixed"
    });
}
