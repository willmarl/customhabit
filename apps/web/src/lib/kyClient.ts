import ky from 'ky'

export const kyClient = ky.create({
  prefix: '/api',
})
