export const AVATAR_PRESETS = Object.freeze([
  { id: 'orbit', label: 'Órbita neón' },
  { id: 'prism', label: 'Prisma violeta' },
  { id: 'pulse', label: 'Pulso cinematográfico' },
  { id: 'frame', label: 'Fotograma verde' },
  { id: 'nova', label: 'Nova magenta' },
  { id: 'signal', label: 'Señal digital' },
])

const MAX_SOURCE_SIZE = 5 * 1024 * 1024
const OUTPUT_SIZE = 256
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('read'))
  reader.readAsDataURL(file)
})

export const prepareAvatarImage = async (file) => {
  if (!file || !ALLOWED_TYPES.has(file.type)) throw new Error('Selecciona una imagen JPG, PNG o WebP.')
  if (file.size > MAX_SOURCE_SIZE) throw new Error('La foto puede pesar hasta 5 MB.')
  const source = await readFile(file)
  const image = await new Promise((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('No pudimos leer esa imagen.'))
    element.src = source
  })
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const context = canvas.getContext('2d')
  const crop = Math.min(image.naturalWidth, image.naturalHeight)
  const sourceX = (image.naturalWidth - crop) / 2
  const sourceY = (image.naturalHeight - crop) / 2
  context.drawImage(image, sourceX, sourceY, crop, crop, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
  const result = canvas.toDataURL('image/webp', 0.82)
  if (result.length > 300_000) throw new Error('No pudimos comprimir la foto lo suficiente. Prueba otra imagen.')
  return result
}

export function ProfileAvatar({ nombre, preset = '', image = '', size = 'large' }) {
  const initial = String(nombre ?? '?').trim().slice(0, 1).toUpperCase() || '?'
  return <span className={`profile-avatar profile-avatar--${size} ${image ? 'profile-avatar--custom' : preset ? `profile-avatar--${preset}` : 'profile-avatar--fallback'}`} aria-hidden="true">{image ? <img src={image} alt="" /> : <span>{preset ? '' : initial}</span>}</span>
}

export function AvatarPicker({ value, image, nombre, onChange, onImageChange, onImageError }) {
  const chooseImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try { onImageChange(await prepareAvatarImage(file)) } catch (error) { onImageError(error.message) }
  }
  return (
    <fieldset className="profile-editor__fieldset">
      <legend>Avatar</legend>
      <p id="avatar-picker-help">Sube una foto o elige una identidad visual. La foto se recorta y comprime antes de guardarse.</p>
      <div className="avatar-upload">
        <ProfileAvatar nombre={nombre} preset={value} image={image} size="small" />
        <div><label className="button button--secondary" htmlFor="profile-avatar-upload">{image ? 'Cambiar foto' : 'Subir foto'}</label><input className="avatar-upload__input" id="profile-avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />{image ? <button className="profile-avatar-remove" type="button" onClick={() => onImageChange('')}>Quitar foto</button> : null}<small>JPG, PNG o WebP · máximo 5 MB</small></div>
      </div>
      <div className="avatar-picker" aria-describedby="avatar-picker-help">
        <button className={`avatar-option ${value === '' && !image ? 'avatar-option--selected' : ''}`} type="button" aria-pressed={value === '' && !image} onClick={() => onChange('')}><ProfileAvatar nombre={nombre} size="small" /><span>Inicial</span></button>
        {AVATAR_PRESETS.map((preset) => <button className={`avatar-option ${value === preset.id ? 'avatar-option--selected' : ''}`} type="button" aria-pressed={value === preset.id} onClick={() => onChange(preset.id)} key={preset.id}><ProfileAvatar nombre={nombre} preset={preset.id} size="small" /><span>{preset.label}</span></button>)}
      </div>
    </fieldset>
  )
}
