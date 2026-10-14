import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[80vh] flex-col justify-center pt-24">
      <p className="label text-copper">404</p>
      <h1 className="display mt-4 text-5xl">This connection was never made.</h1>
      <p className="mt-4 text-mist">The page you were looking for does not exist, or it moved.</p>
      <Link href="/" className="mt-8 inline-flex w-fit items-center gap-2 border-b border-copper pb-1">Back to the start <span aria-hidden>→</span></Link>
    </section>
  );
}
