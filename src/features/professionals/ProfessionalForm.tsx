import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'
import { errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '@/components/styles'
import { professionalSchema, type Professional, type ProfessionalFormValues } from './schema'
import { createProfessional, updateProfessional, listProfilesForLink } from './api'
import { PhotoUpload } from './PhotoUpload'
import { ProfessionalServicesEditor } from './ProfessionalServicesEditor'
import { ProfessionalScheduleEditor } from './ProfessionalScheduleEditor'

interface Props {
  professional: Professional | null
  onCancel: () => void
  onSaved: (message: string) => void
}

export function ProfessionalForm({ professional, onCancel, onSaved }: Props) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const isNew = !professional

  const { data: profiles } = useQuery({
    queryKey: ['profiles-professional'],
    queryFn: listProfilesForLink,
    enabled: !!profile,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: professional?.name ?? '',
      specialty: professional?.specialty ?? '',
      bio: professional?.bio ?? '',
      profile_id: professional?.profile_id ?? '',
      is_active: professional?.is_active ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: ProfessionalFormValues) => {
      if (!profile) throw new Error('sem_permissao')
      if (professional) await updateProfessional(professional.id, values)
      else await createProfessional(values)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['professionals'] })
      onSaved(isNew ? 'Profissional criado.' : 'Profissional atualizado.')
    },
    onError: (e) => setServerError(e instanceof Error ? e.message : 'Não foi possível salvar.'),
  })

  function onSubmit(values: ProfessionalFormValues) {
    setServerError(null)
    mutation.mutate(values)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Nome</label>
          <input className={inputClass} {...register('name')} />
          {errors.name && <p role="alert" className="text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Especialidade</label>
          <input className={inputClass} {...register('specialty')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Bio</label>
          <textarea rows={3} className="w-full rounded-[10px] border border-[#bfcbce] bg-white px-3.5 py-3 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30" {...register('bio')} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Vincular a usuário (perfil professional)</label>
          <select className={inputClass} {...register('profile_id')}>
            <option value="">— nenhum —</option>
            {(profiles ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 text-[15px]">
          <input id="is_active" type="checkbox" className="h-5 w-5" {...register('is_active')} />
          <label htmlFor="is_active">Ativo</label>
        </div>

        {serverError && <p role="alert" className={errorBoxClass}>{serverError}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>Cancelar</button>
          <button type="submit" disabled={mutation.isPending} className={`${primaryButtonClass} flex-1`}>
            {mutation.isPending ? 'Salvando…' : (isNew ? 'Criar' : 'Salvar dados')}
          </button>
        </div>
      </form>

      {!isNew && professional && (
        <>
          <PhotoUpload professionalId={professional.id} photoUrl={professional.photo_url} onSaved={onSaved} />
          <ProfessionalServicesEditor professionalId={professional.id} onSaved={onSaved} />
          <ProfessionalScheduleEditor professionalId={professional.id} onSaved={onSaved} />
        </>
      )}
    </div>
  )
}