import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenTransition } from '../../../components/ScreenTransition'
import {
  CasaIcon,
  ContasIcon,
  FestaIcon,
  GruposIcon,
  Text,
  TrabalhoIcon,
  ViagemIcon,
} from '../../../components/ui'
import { Colors, Radius, Shadows, Spacing } from '../../../constants/theme'
import type { GroupStackParamList } from '../../../navigation/types'

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type Props = NativeStackScreenProps<GroupStackParamList, 'CreateGroupName'>

type Category = 'casa' | 'trabalho' | 'viagem' | 'festa' | 'amigos' | 'outro'

interface CategoryOption {
  key: Category
  label: string
  Icon: React.FC<{ size?: number; color?: string }>
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const CATEGORIES: CategoryOption[] = [
  { key: 'casa',      label: 'Casa',      Icon: CasaIcon     },
  { key: 'trabalho',  label: 'Trabalho',  Icon: TrabalhoIcon },
  { key: 'viagem',    label: 'Viagem',    Icon: ViagemIcon   },
  { key: 'festa',     label: 'Festa',     Icon: FestaIcon    },
  { key: 'amigos',    label: 'Amigos',    Icon: GruposIcon   },
  { key: 'outro',     label: 'Outro',     Icon: ContasIcon   },
]

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export function CreateGroupNameScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('outro')
  const [inputFocused, setInputFocused] = useState(false)

  const canContinue = name.trim().length > 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenTransition>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Text variant="body" color={Colors.brand.primary}>← Voltar</Text>
              </TouchableOpacity>
              <Text variant="h2" color={Colors.neutral.primary} weight="700">
                Criar grupo
              </Text>
              <Text variant="body" color={Colors.neutral.secondary}>
                Como vai se chamar o grupo?
              </Text>
            </View>

            {/* ── Nome ── */}
            <View style={styles.field}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.fieldLabel}>
                Nome do grupo
              </Text>
              <TextInput
                style={[styles.input, inputFocused && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ex: Viagem pra SP, Rep da galera..."
                placeholderTextColor={Colors.neutral.placeholder}
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                maxLength={40}
              />
            </View>

            {/* ── Categoria ── */}
            <View style={styles.field}>
              <Text variant="label" color={Colors.neutral.secondary} weight="600" style={styles.fieldLabel}>
                Categoria
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const active = category === cat.key
                  const iconColor = active ? Colors.neutral.white : Colors.neutral.secondary
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryBtn, active && styles.categoryBtnActive]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.7}
                    >
                      <cat.Icon size={18} color={iconColor} />
                      <Text
                        variant="caption"
                        color={iconColor}
                        weight={active ? '700' : '400'}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          {/* ── Rodapé fixo ── */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
              onPress={() => {
                if (!canContinue) return
                navigation.navigate('CreateGroupMembers', { name: name.trim(), category })
              }}
              activeOpacity={canContinue ? 0.8 : 1}
            >
              <Text variant="label" color={Colors.neutral.white} weight="700">
                Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenTransition>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    marginLeft: 2,
  },
  input: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.neutral.primary,
    backgroundColor: Colors.neutral.white,
  },
  inputFocused: {
    borderColor: Colors.brand.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  categoryBtn: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    backgroundColor: Colors.neutral.white,
  },
  categoryBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  continueBtn: {
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    shadowColor: Colors.brand.primary,
    shadowOpacity: 0.3,
  },
  continueBtnDisabled: {
    backgroundColor: Colors.neutral.border,
    shadowOpacity: 0,
    elevation: 0,
  },
})
