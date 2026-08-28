export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-brand">School Portal</h1>
      <p className="mt-2 text-gray-600">
        Multi-tenant school management platform.
      </p>
      <div className="mt-6 flex gap-4">
        <a href="/register" className="bg-brand text-white rounded px-4 py-2 font-medium">
          Register your school
        </a>
        <a href="/login" className="border border-gray-300 rounded px-4 py-2 font-medium">
          Log in
        </a>
      </div>
    </main>
  );
}
