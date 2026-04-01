export function useStorage() {
  const { $insforge: _insforge } = useNuxtApp()
  const $insforge = _insforge as import('@insforge/sdk').InsForgeClient

  async function uploadFile(file: File) {
    const { data, error } = await $insforge.storage
      .from('uploads')
      .uploadAuto(file)

    if (error) throw error

    return {
      url: data!.url,
      key: data!.key,
      name: file.name,
      size: file.size,
      type: file.type
    }
  }

  async function deleteFile(key: string) {
    const { error } = await $insforge.storage
      .from('uploads')
      .remove(key)

    if (error) throw error
  }

  return {
    uploadFile,
    deleteFile
  }
}
