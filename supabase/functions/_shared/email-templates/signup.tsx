/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>GREENPAC</Heading>
        <Heading style={h1}>Confirmá tu email</Heading>
        <Text style={text}>
          ¡Gracias por registrarte en{' '}
          <Link href={siteUrl} style={link}>
            <strong>Greenpac</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Confirmá tu dirección de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) haciendo clic en el botón de abajo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar email
        </Button>
        <Text style={footer}>
          Si no creaste una cuenta, podés ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a5c2a', letterSpacing: '2px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a5c2a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 22px' }
const link = { color: '#1a5c2a', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1a5c2a',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '14px 32px',
  textDecoration: 'none',
  border: '2px solid #1a5c2a',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#888888', margin: '32px 0 0', lineHeight: '1.6' }
