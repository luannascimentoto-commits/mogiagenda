import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function PrivacyModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Política de Privacidade</h2>
          <button onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-surface">✕</button>
        </div>
        <div className="space-y-3 text-sm text-ink">
          <p>
            A AgendaMogi trata os dados pessoais (nome, telefone e e-mail) coletados no agendamento
            com a finalidade exclusiva de viabilizar e gerenciar o atendimento solicitado pela clínica.
          </p>
          <p>
            <strong>Base legal:</strong> execução de contrato/serviço (art. 7º, V, LGPD) e consentimento
            do titular (art. 7º, I) para o envio de comunicações sobre o agendamento.
          </p>
          <p>
            <strong>Dados coletados:</strong> nome completo, telefone, e-mail e a versão da política aceita.
            Não coletamos dados clínicos (prontuário, diagnóstico) em nenhuma etapa.
          </p>
          <p>
            <strong>Compartilhamento:</strong> os dados são acessíveis apenas à clínica responsável pelo
            atendimento e à AgendaMogi como operadora, nos termos do contrato de operação de dados.
          </p>
          <p>
            <strong>Retenção:</strong> os dados são mantidos pelo período necessário ao cumprimento das
            obrigações legais e fiscais da clínica. O titular pode solicitar acesso, correção ou exclusão
            pelo canal de contato da clínica ou da AgendaMogi.
          </p>
          <p>
            <strong>Direitos do titular (art. 18, LGPD):</strong> confirmação de tratamento, acesso,
            correção, anonimização/exclusão, portabilidade, informação sobre compartilhamento e revogação
            do consentimento.
          </p>
          <p className="text-xs text-muted">
            Versão v1 · Última atualização: 2026. Texto provisório — revisar com assessoria jurídica antes da publicação.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="h-11 rounded-[10px] bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}