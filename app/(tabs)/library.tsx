import { useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/constants/colors'
import { useDrills } from '@/hooks/useDrills'
import type { DrillRow } from '@/db/schema'
import type { SkillArea } from '@/types'

type FilterOption = 'all' | SkillArea

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'teeShot', label: 'Tee Shots' },
  { key: 'irons', label: 'Iron Play' },
  { key: 'shortGame', label: 'Short Game' },
  { key: 'putting', label: 'Putting' },
  { key: 'courseMgmt', label: 'Course Mgmt' },
]

const PROGRAM_LABELS: Record<string, string> = {
  break100: '100',
  break90: '90',
  break80: '80',
}

export default function LibraryScreen() {
  const { data: allDrills = [] } = useDrills()
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    activeFilter === 'all'
      ? allDrills
      : allDrills.filter((d) => d.skillArea === activeFilter)

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function renderDrill({ item }: { item: DrillRow }) {
    const isExpanded = expandedId === item.id
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.drillName}>{item.name}</Text>
          <Text style={styles.duration}>{item.durationMinutes} min</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.skillBadge}>
            <Text style={styles.skillBadgeText}>
              {FILTERS.find((f) => f.key === item.skillArea)?.label ?? item.skillArea}
            </Text>
          </View>
          {(item.programSlugs as string[]).map((slug) => (
            <View key={slug} style={styles.programBadge}>
              <Text style={styles.programBadgeText}>
                {PROGRAM_LABELS[slug] ?? slug}
              </Text>
            </View>
          ))}
        </View>
        {isExpanded && (
          <Text style={styles.instructions}>{item.instructions}</Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerArea}>
        <Text style={styles.heading}>Drill Library</Text>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.pill, activeFilter === f.key && styles.pillActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[styles.pillText, activeFilter === f.key && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={renderDrill}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No drills found</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  filterRow: {
    gap: 8,
  },
  pill: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    paddingTop: 8,
    gap: 10,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  duration: {
    fontSize: 14,
    color: colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  skillBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  programBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  programBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  instructions: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 10,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
})
