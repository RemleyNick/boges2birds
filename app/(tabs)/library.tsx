import { useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'

import { colors } from '@/constants/colors'
import { useEntitlement } from '@/hooks/useEntitlement'
import { usePaywall } from '@/hooks/usePaywall'
import { useDrills } from '@/hooks/useDrills'
import { ARTICLE_SEEDS } from '@/engine/articleSeeds'
import type { DrillRow } from '@/db/schema'
import type { SkillArea, Article, ArticleCategory } from '@/types'

type FilterOption = 'all' | SkillArea
type ArticleFilterOption = 'all' | ArticleCategory
type ActiveTab = 'drills' | 'articles'

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'teeShot', label: 'Tee Shots' },
  { key: 'irons', label: 'Iron Play' },
  { key: 'shortGame', label: 'Short Game' },
  { key: 'putting', label: 'Putting' },
  { key: 'courseMgmt', label: 'Course Mgmt' },
]

const ARTICLE_FILTERS: { key: ArticleFilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'courseManagement', label: 'Course Mgmt' },
  { key: 'mindset', label: 'Mindset' },
  { key: 'statistics', label: 'Statistics' },
  { key: 'strategy', label: 'Strategy' },
]

const PROGRAM_LABELS: Record<string, string> = {
  break100: '100',
  break90: '90',
  break80: '80',
}

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  courseManagement: 'Course Mgmt',
  mindset: 'Mindset',
  statistics: 'Statistics',
  strategy: 'Strategy',
}

export default function LibraryScreen() {
  const { data: allDrills = [], isLoading } = useDrills()
  const { isPremium } = useEntitlement()
  const { showPaywall } = usePaywall()
  const [activeTab, setActiveTab] = useState<ActiveTab>('drills')
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
  const [articleFilter, setArticleFilter] = useState<ArticleFilterOption>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null)

  const filteredDrills =
    activeFilter === 'all'
      ? allDrills
      : allDrills.filter((d) => d.skillArea === activeFilter)

  const filteredArticles =
    articleFilter === 'all'
      ? ARTICLE_SEEDS
      : ARTICLE_SEEDS.filter((a) => a.category === articleFilter)

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function toggleArticleExpand(id: string) {
    setExpandedArticleId((prev) => (prev === id ? null : id))
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
          <Text style={styles.drillName} numberOfLines={2}>{item.name}</Text>
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

  function renderArticle({ item }: { item: Article }) {
    const isExpanded = expandedArticleId === item.id
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => toggleArticleExpand(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.drillName} numberOfLines={2}>{item.title}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.skillBadge}>
            <Text style={styles.skillBadgeText}>
              {CATEGORY_LABELS[item.category]}
            </Text>
          </View>
        </View>
        {isExpanded && (
          <Text style={styles.instructions}>{item.body}</Text>
        )}
      </TouchableOpacity>
    )
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={48} color={colors.textSubtle} style={styles.lockedIcon} />
          <Text style={styles.lockedTitle}>Browse Drills & Articles with Premium</Text>
          <Text style={styles.lockedBody}>
            Access the full drill library and golf articles to level up your game.
          </Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => showPaywall()}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerArea}>
        <Text style={styles.heading}>Library</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.togglePill, activeTab === 'drills' && styles.togglePillActive]}
            onPress={() => setActiveTab('drills')}
          >
            <Text style={[styles.toggleText, activeTab === 'drills' && styles.toggleTextActive]}>
              Practice Drills
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.togglePill, activeTab === 'articles' && styles.togglePillActive]}
            onPress={() => setActiveTab('articles')}
          >
            <Text style={[styles.toggleText, activeTab === 'articles' && styles.toggleTextActive]}>
              Golf Articles
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'drills' ? (
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
        ) : (
          <FlatList
            horizontal
            data={ARTICLE_FILTERS}
            keyExtractor={(f) => f.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item: f }) => (
              <TouchableOpacity
                style={[styles.pill, articleFilter === f.key && styles.pillActive]}
                onPress={() => setArticleFilter(f.key)}
              >
                <Text style={[styles.pillText, articleFilter === f.key && styles.pillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      {activeTab === 'drills' ? (
        <FlatList
          data={filteredDrills}
          keyExtractor={(d) => d.id}
          renderItem={renderDrill}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No drills found</Text>
              <Text style={styles.emptyBody}>
                {activeFilter === 'all'
                  ? 'Drills will appear here once your plan is generated.'
                  : 'Try selecting a different skill area.'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(a) => a.id}
          renderItem={renderArticle}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No articles found</Text>
              <Text style={styles.emptyBody}>
                Try selecting a different category.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
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
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  togglePill: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  togglePillActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    gap: 8,
  },
  pill: {
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.accentLight,
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
    backgroundColor: colors.border,
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
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  lockedIcon: {
    marginBottom: 4,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  lockedBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
