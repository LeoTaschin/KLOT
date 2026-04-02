/**
 * EXEMPLO DE USO - Design System KLOT
 *
 * Este componente demonstra como usar todos os componentes UI
 * e tokens de design do KLOT de forma integrada
 */

import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'

import { Colors, Radius, Spacing, Typography } from '../constants/theme'
import { Badge, Button, Card, Divider, Text } from './ui'

/**
 * ═══════════════════════════════════════════════════════════════════
 * EXEMPLO COMPLETO
 * ═══════════════════════════════════════════════════════════════════
 *
 * Mostra um dashboard de saldo com:
 * - Tipografia variada (display, headings, body)
 * - Cards com diferentes configurações
 * - Badges de status
 * - Botões com diferentes variantes
 * - Divisores
 */

export function DesignSystemExample() {
  const [loading, setLoading] = useState(false)

  const handlePress = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: Colors.neutral.surface,
      }}
      contentContainerStyle={{
        padding: Spacing.md,
        gap: Spacing.lg,
      }}
    >
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 1: TIPOGRAFIA */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Card shadow="md">
        <Text variant="h2" weight="700">
          Typografia Completa
        </Text>

        <Divider spacing={Spacing.md} />

        <View style={{ gap: Spacing.sm }}>
          <Text variant="display">Display (32px, 800)</Text>
          <Text variant="h1">Heading 1 (28px, 700)</Text>
          <Text variant="h2">Heading 2 (22px, 700)</Text>
          <Text variant="h3">Heading 3 (18px, 600)</Text>
          <Text variant="bodyLg">Body Large (16px, 400)</Text>
          <Text variant="body">Body (14px, 400)</Text>
          <Text variant="label">Label (14px, 500)</Text>
          <Text variant="caption" color={Colors.neutral.secondary}>
            Caption (12px, 400)
          </Text>
        </View>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 2: SALDO */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Card
        padding={Spacing.lg}
        shadow="lg"
        border
      >
        <Text
          variant="label"
          color={Colors.neutral.secondary}
        >
          Saldo Total
        </Text>

        <Text
          variant="display"
          color={Colors.brand.primary}
          style={{ marginTop: Spacing.sm }}
        >
          R$ 5.280,50
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: Spacing.md,
            marginTop: Spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              variant="caption"
              color={Colors.neutral.secondary}
            >
              Crédito
            </Text>
            <Text
              variant="h3"
              color={Colors.status.credit}
              weight="600"
            >
              R$ 8.500,00
            </Text>
          </View>

          <Divider spacing={0} height={40} />

          <View style={{ flex: 1 }}>
            <Text
              variant="caption"
              color={Colors.neutral.secondary}
            >
              Débito
            </Text>
            <Text
              variant="h3"
              color={Colors.status.debt}
              weight="600"
            >
              R$ 3.219,50
            </Text>
          </View>
        </View>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 3: TRANSAÇÕES COM BADGES */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Card shadow="md">
        <Text variant="h3">Transações Recentes</Text>

        <Divider spacing={Spacing.md} />

        {/* Transação 1 */}
        <View style={{ marginBottom: Spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            <Text variant="label" weight="600">
              Restaurante XYZ
            </Text>
            <Badge
              variant="debt"
              label="Débito"
              size="sm"
            />
          </View>
          <Text
            variant="body"
            color={Colors.neutral.secondary}
          >
            15 de Março • R$ 45,90
          </Text>
        </View>

        <Divider spacing={Spacing.md} />

        {/* Transação 2 */}
        <View style={{ marginBottom: Spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            <Text variant="label" weight="600">
              Depósito de Salário
            </Text>
            <Badge
              variant="credit"
              label="Crédito"
              size="sm"
            />
          </View>
          <Text
            variant="body"
            color={Colors.neutral.secondary}
          >
            01 de Março • R$ 3.500,00
          </Text>
        </View>

        <Divider spacing={Spacing.md} />

        {/* Transação 3 */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            <Text variant="label" weight="600">
              Pagamento de Conta
            </Text>
            <Badge
              variant="settled"
              label="Resolvido"
              size="sm"
            />
          </View>
          <Text
            variant="body"
            color={Colors.neutral.secondary}
          >
            28 de Fevereiro • R$ 250,00
          </Text>
        </View>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 4: BOTÕES */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Card shadow="md">
        <Text variant="h3">Variantes de Botão</Text>

        <Divider spacing={Spacing.md} />

        <View style={{ gap: Spacing.md }}>
          {/* Linha 1: Primary variantes */}
          <View style={{ gap: Spacing.sm }}>
            <Button
              variant="primary"
              size="lg"
              label="Botão Primary (Large)"
              onPress={() => console.log('primary lg')}
              fullWidth
            />
            <Button
              variant="primary"
              size="md"
              label="Botão Primary (Medium)"
              onPress={() => console.log('primary md')}
              fullWidth
            />
            <Button
              variant="primary"
              size="sm"
              label="Small"
              onPress={() => console.log('primary sm')}
            />
          </View>

          <Divider spacing={Spacing.md} />

          {/* Linha 2: Secondary */}
          <Button
            variant="secondary"
            label="Botão Secondary"
            onPress={() => console.log('secondary')}
            fullWidth
          />

          {/* Linha 3: Outline */}
          <Button
            variant="outline"
            label="Botão Outline"
            onPress={() => console.log('outline')}
            fullWidth
          />

          {/* Linha 4: Ghost */}
          <Button
            variant="ghost"
            label="Botão Ghost"
            onPress={() => console.log('ghost')}
            fullWidth
          />

          {/* Linha 5: Destructive */}
          <Button
            variant="destructive"
            label="Botão Destructive"
            onPress={() => console.log('destructive')}
            fullWidth
          />

          {/* Linha 6: Loading */}
          <Button
            variant="primary"
            label={loading ? 'Enviando...' : 'Com Loading'}
            onPress={handlePress}
            loading={loading}
            fullWidth
          />

          {/* Linha 7: Disabled */}
          <Button
            variant="primary"
            label="Desabilizado"
            onPress={() => {}}
            disabled
            fullWidth
          />
        </View>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SEÇÃO 5: CORES E PALETA */}
      {/* ═══════════════════════════════════════════════════════════ */}

      <Card shadow="md">
        <Text variant="h3">Paleta de Cores</Text>

        <Divider spacing={Spacing.md} />

        {/* Brand Colors */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text
            variant="label"
            color={Colors.neutral.secondary}
            weight="600"
          >
            Brand
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.sm,
              marginTop: Spacing.sm,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.brand.primary,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.brand.dark,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.brand.light,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.brand.xlight,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: Colors.neutral.border,
              }}
            />
          </View>
        </View>

        {/* Status Colors */}
        <View>
          <Text
            variant="label"
            color={Colors.neutral.secondary}
            weight="600"
          >
            Status
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: Spacing.sm,
              marginTop: Spacing.sm,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.status.debt,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.status.credit,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.status.settled,
                borderRadius: Radius.md,
              }}
            />
            <View
              style={{
                flex: 1,
                height: 60,
                backgroundColor: Colors.status.pending,
                borderRadius: Radius.md,
              }}
            />
          </View>
        </View>
      </Card>

      {/* Espaço no final para scroll */}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}
