import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorBoxClass, secondaryButtonClass } from '@/components/styles'
import { uploadLogo } from './api'

interface Props {
  clinicId: string
  logoUrl: string | null
  onSaved: (message: string) => void
}

export function LogoUpload({ clinicId, logoUrl, onSaved }: Props) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(logoUrl)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (file: File) => uploadLogo(clinicId, file),
    onSuccess: async (url) => {
      setPreview(url)
      await queryClient.invalidateQueries({ queryKey: ['clinic'] })
      onSaved('Logotipo atualizado.')
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'mime_invalido') setError('Formato inválido. Use JPEG, PNG ou WebP.')
      else if (msg === 'arquivo_grande') setError('Arquivo maior que 2 MB.')
      else setError(msg || 'Não foi possível enviar o logotipo.')
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    mutation.mutate(file)
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-lg font-bold">Logotipo</h2>
      <div className="flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Logotipo da clínica" className="h-20 w-20 rounded-xl object-cover border border-line" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-line text-muted text-sm">
            Sem logo
          </div>
        )}
        <div className="space-y-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleChange} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={mutation.isPending} className={secondaryButtonClass}>
            {mutation.isPending ? 'Enviando…' : 'Escolher imagem'}
          </button>
          <p className="text-xs text-muted">JPEG, PNG ou WebP, até 2 MB. A imagem é redimensionada automaticamente.</p>
        </div>
      </div>
      {error && <p role="alert" className={errorBoxClass}>{error}</p>}
    </section>
  )
}