export default function LoginPage() {
  return (
    <section className="mx-auto max-w-xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accentDark">
          Auth scaffold
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">Log in to RecipeAI</h1>
        <form className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-2xl border border-sand bg-white px-4 py-3 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border border-sand bg-white px-4 py-3 outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white"
          >
            Continue
          </button>
        </form>
      </div>
    </section>
  );
}
