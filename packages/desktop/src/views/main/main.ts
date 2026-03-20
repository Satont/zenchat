import { Electroview } from "electrobun/view";
import { createApp } from "vue";
import App from "./App.vue";
import type { ZenchatRPCSchema } from "../../shared/rpc";

// ----------------------------------------------------------------
// Set up Electrobun RPC on the webview side
// ----------------------------------------------------------------

export const rpc = Electroview.defineRPC<ZenchatRPCSchema>({
  handlers: {
    requests: {},
    messages: {},
  },
});

new Electroview({ rpc });

// ----------------------------------------------------------------
// Mount Vue app
// ----------------------------------------------------------------

createApp(App).mount("#app");
