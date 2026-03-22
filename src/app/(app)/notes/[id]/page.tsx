import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NoteDetailRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/dyrkningslog/${id}`)
}
