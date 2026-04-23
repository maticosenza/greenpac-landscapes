/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>GREENPAC</Heading>
        <Heading style={h1}>Tu enlace de acceso</Heading>
        <Text style={text}>
          Hacé clic en el botón de abajo para ingresar a Greenpac. Este enlace
          expira en breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Ingresar
        </Button>
        <Text style={footer}>
          Si no solicitaste este enlace, podés ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a5c2a', letterSpacing: '2px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a5c2a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 22px' }
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
