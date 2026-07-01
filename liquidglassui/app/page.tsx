"use client";

import { CreateMenu } from "@/components/ui/create-menu";

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(https://images.unsplash.com/photo-1686579809662-829e8374d0a8?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        // backgroundColor: "#0b0e13",
      }}
    >
      <CreateMenu />
    </main>
  );
}
