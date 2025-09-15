export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-red-600">403</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mt-2">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
        <div className="space-y-4">
          <a
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Fazer Login
          </a>
          <div>
            <a href="/" className="text-indigo-600 hover:text-indigo-500">
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
