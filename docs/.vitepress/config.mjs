import { defineConfig } from "vitepress";
import { apiSidebar } from "./tmp/api-sidebar";

export default defineConfig({
    title: "BatchJS Data",
    description: "Extension of Batch JS adding data storage support for databases.",
    base: "/batchjs-data/",
    themeConfig: {
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
