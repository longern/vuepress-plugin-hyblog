<script setup lang="ts">
import ParentLayout from "@vuepress/theme-default/lib/client/layouts/Layout.vue";
import { usePageData } from "@vuepress/client";

const paginator = (<Record<string, any>>usePageData().value).paginator;
</script>

<template>
  <ParentLayout>
    <template #page-content-bottom>
      <div v-for="post in paginator?.posts" :key="post.slug" class="well">
        <div>
          <a :href="post.url">
            <h2 v-text="post.title"></h2>
          </a>
        </div>
        <div v-html="post.excerpt" class="excerpt"></div>
        <div v-text="post.date" class="date"></div>
        <a :href="post.url">Read more...</a>
      </div>
      <div>
        <ul class="pagination" v-if="paginator?.totalPages > 1">
          <li v-if="paginator?.page !== 1">
            <a :href="paginator.page === 2 ? '/' : `page${paginator.page - 1}`">
              &laquo;
            </a>
          </li>
          <template v-for="page in paginator?.totalPages" :key="page">
            <li v-if="Math.abs(paginator?.page - page) <= 3">
              <span v-if="page === paginator.page" v-text="page"></span>
              <a v-else :href="page === 1 ? '/' : `page${page}`">
                <span v-text="page"></span>
              </a>
            </li>
          </template>
          <li v-if="paginator?.page !== paginator?.totalPages">
            <a :href="`page${paginator.page + 1}`">&raquo;</a>
          </li>
        </ul>
      </div>
    </template>
  </ParentLayout>
</template>

<style>
.well {
  margin-top: 16px;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
}

.well .date {
  float: right;
  color: #999;
}

.well .excerpt {
  margin-bottom: 24px;
  white-space: pre-wrap;
}

ul.pagination {
  margin: 16px 0;
  padding: 0;
  list-style: none;
  display: flex;
  justify-content: center;
}

ul.pagination > li {
  display: inline-block;
  padding: 0 8px;
}
</style>
