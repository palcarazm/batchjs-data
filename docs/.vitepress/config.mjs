import { defineConfig } from "vitepress";
import { apiSidebar } from "./tmp/api-sidebar";

export default defineConfig({
    title: "BatchJS Data",
    description: "Extension of Batch JS adding data storage support for databases.",
    base: "/batchjs-data/",

    head: [
        ["link", { rel: "icon", type: "image/x-icon", href: "/batchjs-data/favicon.ico" }],
        ["link", { rel: "icon", type: "image/png", href: "/batchjs-data/favicon.png" }],
        ["meta", { name: "author", content: "https://github.com/palcarazm" }],
        ["meta", { name: "robots", content: "index, follow" }],
        ["meta", { name: "revisit-after", content: "1 month" }],
        ["meta", { property: "og:description", content: "Database batch readers and writers for BatchJS. Read and write large datasets from SQLite, PostgreSQL, MariaDB, and MySQL with a consistent streaming API." }],
        ["meta", { property: "og:url", content: "https://palcarazm.github.io/batchjs-data" }],
        ["meta", { property: "og:image", content: "https://palcarazm.github.io/batchjs-data/card.png" }],
        ["meta", { property: "og:image:width", content: "728" }],
        ["meta", { property: "og:image:height", content: "364" }],
    ],

    themeConfig: {
        logo: "/logo.png",
        siteTitle: "",
        search: {
            provider: "local",
        },
        socialLinks: [
            { icon: "github", link: "https://github.com/palcarazm/batchjs-data" },
        ],
        outline: [2, 3],
        nav: [
            { text: "Guide", link: "/guide/getting-started" },
            { text: "API", link: "/api" }
        ],
        sidebar: {
            "/guide/": [
                {
                    text: "Guide",
                    items: [
                        { text: "Getting Started", link: "/guide/getting-started" },
                        {
                            text: "Database guides",
                            items: [
                                { text: "SQLite", link: "/guide/sqlite" },
                                { text: "PostgreSQL", link: "/guide/postgresql" },
                                { text: "MariaDB", link: "/guide/mariadb" },
                                { text: "MySQL", link: "/guide/mysql" }
                            ]
                        }
                    ],
                },
            ],
            "/api/": [apiSidebar]
        },
    }
});
