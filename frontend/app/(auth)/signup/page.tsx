export default function SignupPage() {
  return (
    <section className="mx-auto max-w-xl px-6 py-12">
      <div className="recipe-shell rounded-[2rem] border border-white/60 p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-herb">
          Supabase-ready
        </p>
        <h1 className="mt-4 font-display text-4xl text-ink">Create your RecipeAI account</h1>
        <form className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Full name"
            className="w-full rounded-2xl border border-sand bg-white px-4 py-3 outline-none"
          />
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
            className="w-full rounded-2xl bg-ink px-4 py-3 font-semibold text-white"
          >
            Sign up
          </button>
        </form>
      </div>
    </section>
  );
}
