<template>
  <div class="flex flex-col h-full overflow-auto">
    <h2 class="grid grid-flow-dense items-center gap-x-1 py-2 font-medium bg-zinc-50 justify-center shadow z-20">
      <span>中古住宅適合証明</span>
      <span class="col-start-1 h-px bg-gray-500 overflow-hidden">・</span>
      <span class="col-start-1">既存住宅状況調査</span>
      <span class="col-start-2 row-span-3">のご依頼</span>
    </h2>
    <div class="grow bg-slate-50">
      <RouterView/>
    </div>
  </div>
</template>
