import * as Linking from "expo-linking";

export const linking = {
  prefixes: [Linking.createURL("/"), "safetag://"],
  config: {
    screens: {
      "(tabs)": {
        screens: {
          "(home)": { screens: { index: "" } },
          "(vehicles)": { screens: { index: "vehicles", "[id]": "vehicles/:id" } },
          "(scanner)": { screens: { index: "scanner" } },
          "(incidents)": { screens: { index: "incidents", "[id]": "incidents/:id" } },
          "(profile)": { screens: { index: "profile" } },
        },
      },
      scan: { path: "s", screens: { "[shortCode]": ":shortCode" } },
      "(auth)": { screens: { login: "login" } },
    },
  },
};
