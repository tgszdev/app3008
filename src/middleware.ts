// Desabilitando middleware temporariamente para testar
// Todo o controle será feito no servidor

export default function middleware() {
  // Não fazer nada - deixar passar todas as requisições
  return
}

export const config = {
  matcher: [],
}