import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clearclaim_token') || sessionStorage.getItem('clearclaim_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const downloadFile = async (path: string, defaultFilename?: string) => {
  const response = await api.get(path, { responseType: 'blob' })
  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  })
  
  // Extract filename from Content-Disposition header if available
  let filename = defaultFilename || 'download'
  const disposition = response.headers['content-disposition']
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/)
    if (match && match[1]) filename = match[1]
  }

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}
