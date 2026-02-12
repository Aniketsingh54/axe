import fs from "node:fs";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "public", "weavy-live.html");
const weavyHtml = fs.readFileSync(sourcePath, "utf8");

export default function Home() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        title="Axe landing page"
        srcDoc={weavyHtml}
        className="h-full w-full border-0"
      />
    </div>
  );
}
