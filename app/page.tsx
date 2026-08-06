import { redirect } from "next/navigation";

// Marketing website homepage disabled — Mr. Printer Studio is the home app now.
export default function Home() {
  redirect("/tools/pricing/");
}
