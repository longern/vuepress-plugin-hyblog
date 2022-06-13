import path from "path";
import markdownItKatex from "markdown-it-katex";
import { createPage } from "@vuepress/core";
import { Plugin } from "vuepress";
import { JSDOM } from "jsdom";

const mathMLTags = [
  "annotation",
  "maction",
  "math",
  "menclose",
  "merror",
  "mfenced",
  "mfrac",
  "mi",
  "mmultiscripts",
  "mn",
  "mo",
  "mover",
  "mpadded",
  "mphantom",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "mstyle",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "semantics",
];

export const hyblogPlugin =
  (options?: { homepageSidebar?: any; paginate?: number }): Plugin =>
  (app) => ({
    name: "hyblog",
    async onInitialized(app) {
      options = options || {};
      options.paginate = options.paginate || 10;

      // Remove original index page
      app.pages = app.pages.filter((page) => page.path !== "/index.html");

      if (!("Paginator" in app.layouts))
        app.layouts.Paginator = path.resolve(__dirname, "./Paginator.vue");

      const homepage = await createPage(app, {
        path: "/index.html",
        frontmatter: { layout: "Paginator", sidebar: options.homepageSidebar },
      });
      app.pages.push(homepage);

      const pagesInPosts = app.pages
        .filter((page) => page.filePathRelative?.startsWith("_posts/"))
        .reverse();
      const totalPages = Math.ceil(pagesInPosts.length / options.paginate);

      for (let i = 2; i <= totalPages; i++) {
        const otherPage = await createPage(app, {
          path: `/page${i}.html`,
          frontmatter: {
            layout: "Paginator",
            sidebar: options.homepageSidebar,
          },
        });
        app.pages.push(otherPage);
      }

      // Generate next and prev link
      for (let i = 0; i < pagesInPosts.length; i++) {
        if (i < pagesInPosts.length - 1)
          pagesInPosts[i].frontmatter.next = {
            text: pagesInPosts[i + 1].title,
            link: pagesInPosts[i + 1].path,
          };
        if (i > 0)
          pagesInPosts[i].frontmatter.prev = {
            text: pagesInPosts[i - 1].title,
            link: pagesInPosts[i - 1].path,
          };
      }
    },

    clientConfigFile: path.resolve(__dirname, "./client.config.ts"),

    extendsBundlerOptions: (bundlerOptions, app) => {
      // extends options of @vuepress/bundler-vite
      if (app.options.bundler.name === "@vuepress/bundler-vite") {
        bundlerOptions.vuePluginOptions ??= {};
        bundlerOptions.vuePluginOptions.template ??= {};
        bundlerOptions.vuePluginOptions.template.compilerOptions ??= {};
        const isCustomElement =
          bundlerOptions.vuePluginOptions.template.compilerOptions
            .isCustomElement;
        bundlerOptions.vuePluginOptions.template.compilerOptions.isCustomElement =
          (tag: string) => {
            if (isCustomElement?.(tag)) return true;
            return mathMLTags.includes(tag);
          };
      }

      // extends options of @vuepress/bundler-webpack
      if (app.options.bundler.name === "@vuepress/bundler-webpack") {
        bundlerOptions.vue ??= {};
        bundlerOptions.vue.compilerOptions ??= {};
        const isCustomElement =
          bundlerOptions.vue.compilerOptions.isCustomElement;
        bundlerOptions.vue.compilerOptions.isCustomElement = (tag: string) => {
          if (isCustomElement?.(tag)) return true;
          return mathMLTags.includes(tag);
        };
      }
    },

    extendsMarkdown: (md) => {
      md.use(markdownItKatex);
      app.siteData.head.push([
        "link",
        {
          rel: "stylesheet",
          href: "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css",
        },
      ]);
    },

    extendsPage(page) {
      if (page.frontmatter?.layout === "Paginator") {
        const paginate = <number>options?.paginate;
        const pagesInPosts = app.pages
          .filter((page) => page.filePathRelative?.startsWith("_posts/"))
          .reverse();

        const pageMatch = page.path.match(/\/page(\d+).html/);
        let pageNum = 1;
        if (pageMatch) {
          pageNum = parseInt(pageMatch[1]);
        }
        const start = (pageNum - 1) * paginate;
        const end = pageNum * paginate;
        const pages = pagesInPosts.slice(start, end);

        const posts = pages.map((page) => {
          return {
            slug: page.slug,
            title: page.title,
            url: page.path,
            date: page.date,
            excerpt: page.excerpt,
          };
        });

        const totalPages = Math.ceil(pagesInPosts.length / paginate);
        page.data["paginator"] = {
          page: pageNum,
          perPage: paginate,
          totalPages,
          posts,
        };
      } else {
        if (page.excerpt) {
          const excerptDOM = new JSDOM(page.excerpt);
          const excerptDocument: Document = excerptDOM.window.document;
          const allParagraphs = excerptDocument.querySelectorAll("p");
          page.excerpt = Array.from(allParagraphs)
            .map((para) => para.outerHTML)
            .join("");
        } else {
          const excerptDOM = new JSDOM(page.contentRendered);
          const excerptDocument: Document = excerptDOM.window.document;
          page.excerpt = <string>excerptDocument.querySelector("p")?.outerHTML;
        }
      }
    },

    extendsPageOptions: (pageOptions, app) => {
      if (pageOptions.filePath?.startsWith(app.dir.source("_posts/"))) {
        pageOptions.frontmatter = pageOptions.frontmatter ?? {};
        pageOptions.frontmatter.permalinkPattern =
          "/:year/:month/:day/:slug.html";
      }
    },
  });
