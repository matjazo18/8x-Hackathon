import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fetchSiolNews, type SiolNewsItem } from './src/services/siolNewsSkill';
import { LOCAL_AI_MODEL_NAME, makeSiolNewsPrompt, useLocalAI } from './src/services/localAI';

const sprites = {
  jotaro: require('./assets/jotaro.png'),
  dio: require('./assets/dio.png'),
  giorno: require('./assets/giorno.png'),
  jolyne: require('./assets/jolyne.png'),
  gappy: require('./assets/gappy.png'),
  jonathan: require('./assets/jonathan.png'),
  johnny: require('./assets/johnny-joestar.png'),
  jodio: require('./assets/jodio.png'),
  pikachu: require('./assets/pikachu.png'),
  aang: require('./assets/aang.png'),
  friday: require('./assets/friday.png'),
  midudev: require('./assets/midudev.png'),
};
const skillSprites = {
  joseph: require('./assets/joseph.png'),
  josuke4: require('./assets/josuke4.png'),
  goku: require('./assets/goku.png'),
  kurisu: require('./assets/kurisu.png'),
  pepe: require('./assets/pepe.png'),
  kaka: require('./assets/kaka.png'),
  kebo: require('./assets/kebo.png'),
  boxcat: require('./assets/boxcat.png'),
};
const iceCubeButton = require('./_.jpeg');

type SpriteName = keyof typeof sprites;
type SkillName = keyof typeof skillSprites;
type CreatedAgent = { id: string; name: string; description: string; sprite: SpriteName };
type CreatedSkill = { id: string; name: string; description: string; sprite: SkillName };
type AgentRunStatus = 'idle' | 'fetching' | 'waiting-model' | 'thinking' | 'done' | 'error';

const agentRows: SpriteName[][] = [
  ['jotaro', 'dio'],
  ['giorno', 'jolyne'],
  ['gappy', 'jonathan'],
  ['johnny', 'jodio'],
  ['pikachu', 'aang'],
  ['friday', 'midudev'],
];
const skillRows: SkillName[][] = [
  ['joseph', 'josuke4'],
  ['goku', 'kurisu'],
  ['pepe', 'kaka'],
  ['kebo', 'boxcat'],
];
const agentNames: Record<SpriteName, string> = {
  jotaro: 'Jotaro', dio: 'Dio', giorno: 'Giorno', jolyne: 'Jolyne',
  gappy: 'Gappy', jonathan: 'Jonathan', johnny: 'Johnny', jodio: 'Jodio',
  pikachu: 'Pikachu', aang: 'Aang', friday: 'Friday', midudev: 'midudev',
};
const skillNames: Record<SkillName, string> = {
  joseph: 'Joseph', josuke4: 'Josuke', goku: 'Goku', kurisu: 'Kurisu',
  pepe: 'Pepe', kaka: 'Kaka', kebo: 'Kebo', boxcat: 'Boxcat',
};

function makeRows<T>(items: T[]): T[][] {
  return items.reduce<T[][]>((rows, item, index) => {
    const rowIndex = Math.floor(index / 2);
    if (!rows[rowIndex]) rows[rowIndex] = [];
    rows[rowIndex].push(item);
    return rows;
  }, []);
}

function AgentSprite({ name, style }: { name: SpriteName; style?: object }) {
  return <Image source={sprites[name]} style={[styles.sprite, style]} resizeMode="contain" />;
}

function AnimatedAgentSprite({ name }: { name: SpriteName }) {
  const movement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(movement, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(movement, { toValue: 0, duration: 750, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [movement]);

  return <Animated.View style={[styles.animatedSprite, { transform: [{ translateY: movement.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }, { scale: movement.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }] }]}>
    <AgentSprite name={name} style={styles.gallerySprite} />
  </Animated.View>;
}

function AnimatedSkillSprite({ name }: { name: SkillName }) {
  const movement = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(movement, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(movement, { toValue: 0, duration: 750, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [movement]);

  return <Animated.View style={[styles.animatedSprite, { transform: [{ translateY: movement.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }, { scale: movement.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }] }]}>
    <Image source={skillSprites[name]} style={[styles.sprite, styles.gallerySprite]} resizeMode="contain" />
  </Animated.View>;
}

function CubeButton({ onPress, compact = false }: { onPress: () => void; compact?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Open agent workspace" onPress={onPress} style={[styles.cubeButton, compact && styles.cubeButtonCompact]}>
    <View style={styles.cubeCrop}><Image source={iceCubeButton} style={styles.cubeImage} resizeMode="contain" /></View>
  </Pressable>;
}

export default function App() {
  const [screen, setScreen] = useState<'gallery' | 'workspace'>('gallery');
  const [galleryTab, setGalleryTab] = useState<'agents' | 'skills'>('agents');
  const [selected, setSelected] = useState<SpriteName[]>([]);
  const [task, setTask] = useState('');
  const [creator, setCreator] = useState<'agent' | 'skill' | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [creatorSprite, setCreatorSprite] = useState<SpriteName | SkillName>('jotaro');
  const [createdAgents, setCreatedAgents] = useState<CreatedAgent[]>([]);
  const [createdSkills, setCreatedSkills] = useState<CreatedSkill[]>([]);
  const [news, setNews] = useState<SiolNewsItem[]>([]);
  const [newsError, setNewsError] = useState('');
  const [agentRunStatus, setAgentRunStatus] = useState<AgentRunStatus>('idle');
  const [aiMessage, setAiMessage] = useState('');
  const jotaroSelected = selected.includes('jotaro');
  const localAI = useLocalAI(jotaroSelected);

  useEffect(() => {
    if (!localAI.isReady) return;
    localAI.configure({
      chatConfig: { systemPrompt: 'Si Jotaro, jedrnat slovenski lokalni AI agent. Vedno odgovori v slovenščini in ne izmišljaj dejstev.' },
      generationConfig: { temperature: 0.2, topP: 0.9, repetitionPenalty: 1.1 },
    });
  }, [localAI.configure, localAI.isReady]);

  const finishWithLocalAI = async (items: SiolNewsItem[]) => {
    setAgentRunStatus('thinking');
    try {
      const answer = await localAI.generate([
        { role: 'system', content: 'Si Jotaro, jedrnat slovenski lokalni AI agent. Ne dodajaj dejstev, ki jih ni v vhodu.' },
        { role: 'user', content: makeSiolNewsPrompt(items) },
      ]);
      const cleanAnswer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
      setAiMessage(cleanAnswer || 'Našel sem pet najnovejših novic s Siol.net.');
      setAgentRunStatus('done');
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Lokalni AI ni uspel pripraviti odgovora.');
      setAgentRunStatus('error');
    }
  };

  useEffect(() => {
    if (agentRunStatus === 'waiting-model' && localAI.isReady && news.length) {
      void finishWithLocalAI(news);
    }
  }, [agentRunStatus, localAI.isReady, news]);

  const runSiolNewsSkill = async () => {
    setAgentRunStatus('fetching');
    setNewsError('');
    setNews([]);
    setAiMessage('');
    try {
      const items = await fetchSiolNews(5);
      setNews(items);
      if (localAI.isReady) {
        await finishWithLocalAI(items);
      } else {
        setAgentRunStatus('waiting-model');
      }
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Nalaganje novic ni uspelo.');
      setAgentRunStatus('error');
    }
  };

  const toggleAgent = (name: SpriteName) => {
    if (name === 'jotaro') {
      setSelected((current) => current.includes('jotaro') ? [] : ['jotaro']);
      setTask('Pridobi 5 najnovejših novic s Siol.net');
      setAgentRunStatus('idle');
      setNews([]);
      setAiMessage('');
      setNewsError('');
      return;
    }
    setSelected((current) => current.includes(name) ? current.filter((agent) => agent !== name) : [...current, name].slice(-2));
  };

  const openWorkspace = () => {
    setScreen('workspace');
    if (jotaroSelected) void runSiolNewsSkill();
  };

  const openCreator = () => {
    setItemName('');
    setItemDescription('');
    setCreatorSprite(galleryTab === 'agents' ? 'jotaro' : 'joseph');
    setCreator(galleryTab === 'agents' ? 'agent' : 'skill');
  };

  const saveItem = () => {
    if (!creator || !itemName.trim() || !itemDescription.trim()) return;
    const id = `${creator}-${Date.now()}`;
    if (creator === 'agent') {
      setCreatedAgents((items) => [...items, { id, name: itemName.trim(), description: itemDescription.trim(), sprite: creatorSprite as SpriteName }]);
    } else {
      setCreatedSkills((items) => [...items, { id, name: itemName.trim(), description: itemDescription.trim(), sprite: creatorSprite as SkillName }]);
    }
    setCreator(null);
  };

  if (creator) {
    const isAgent = creator === 'agent';
    const characterChoices = isAgent ? Object.keys(sprites) as SpriteName[] : Object.keys(skillSprites) as SkillName[];
    return <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.creatorPage} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setCreator(null)} style={styles.backButton}><Text style={styles.backText}>‹ Back</Text></Pressable>
        <Text style={styles.creatorTitle}>Create {isAgent ? 'agent' : 'skill'}</Text>
        <Text style={styles.creatorSubtitle}>{isAgent ? 'Give your agent a name and describe what it should do.' : 'Give your skill a name and describe what it should do.'}</Text>
        <Text style={styles.fieldLabel}>NAME</Text>
        <TextInput value={itemName} onChangeText={setItemName} placeholder={isAgent ? 'e.g. Research assistant' : 'e.g. Web research'} placeholderTextColor="#9d9d9d" style={styles.creatorInput} />
        <Text style={styles.fieldLabel}>WHAT SHOULD IT DO?</Text>
        <TextInput value={itemDescription} onChangeText={setItemDescription} multiline textAlignVertical="top" placeholder={isAgent ? "Describe the agent’s job..." : 'Describe what this skill does...'} placeholderTextColor="#9d9d9d" style={[styles.creatorInput, styles.creatorDescription]} />
        <Text style={styles.fieldLabel}>CHARACTER</Text>
        <View style={styles.characterPicker}>
          {characterChoices.map((sprite) => <Pressable key={sprite} onPress={() => setCreatorSprite(sprite)} style={[styles.characterOption, creatorSprite === sprite && styles.characterOptionSelected]}>
            {isAgent ? <AgentSprite name={sprite as SpriteName} style={styles.characterOptionSprite} /> : <Image source={skillSprites[sprite as SkillName]} style={styles.characterOptionSprite} resizeMode="contain" />}
          </Pressable>)}
        </View>
        <Pressable accessibilityRole="button" onPress={saveItem} style={[styles.saveButton, (!itemName.trim() || !itemDescription.trim()) && styles.saveButtonDisabled]}>
          <Text style={styles.saveButtonText}>Save {isAgent ? 'agent' : 'skill'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>;
  }

  if (screen === 'workspace') {
    const primary = selected[0] ?? 'dio';
    const modelProgress = Math.round(localAI.downloadProgress * 100);
    const statusTitle: Record<AgentRunStatus, string> = {
      idle: 'Jotaro je pripravljen',
      fetching: 'Jotaro odpira Siol.net …',
      'waiting-model': 'Pripravljam lokalni AI …',
      thinking: 'Lokalni AI pripravlja odgovor …',
      done: 'Jotaro je končal',
      error: 'Skill se je ustavil',
    };
    return <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.workspace} showsVerticalScrollIndicator={false}>
        <View style={styles.composerRow}>
          <View style={styles.selectedAgents}>
            {selected.map((name) => <Pressable key={name} onPress={() => toggleAgent(name)} style={styles.selectedAgent}>
              <AgentSprite name={name} style={styles.selectedSprite} />
              <View style={styles.remove}><Text style={styles.removeText}>×</Text></View>
            </Pressable>)}
          </View>
          <TextInput value={task} onChangeText={setTask} placeholder="Describe a task..." placeholderTextColor="#9d9d9d" style={[styles.galleryTaskInput, styles.workspaceTaskInput]} />
          <CubeButton onPress={() => setScreen('gallery')} />
        </View>

        <View style={styles.workingCard}>
          <AgentSprite name={primary} style={styles.workingSprite} />
          <View style={styles.workingCopy}>
            <Text style={styles.workingTitle}>{jotaroSelected ? statusTitle[agentRunStatus] : 'Agent is working...'}</Text>
            {jotaroSelected
              ? <><Text style={styles.thinking}>{LOCAL_AI_MODEL_NAME}{!localAI.isReady && ` · ${modelProgress}%`}</Text>{!localAI.isReady && <View style={styles.modelProgressTrack}><View style={[styles.modelProgressFill, { width: `${modelProgress}%` as `${number}%` }]} /></View>}</>
              : <Text style={styles.thinking}>Thinking <Text style={styles.dots}>● ● ●</Text></Text>}
          </View>
        </View>

        {jotaroSelected ? <>
          {!!aiMessage && <View style={styles.aiAnswerCard}><Text style={styles.aiAnswerLabel}>JOTARO · LOCAL AI</Text><Text style={styles.aiAnswerText}>{aiMessage}</Text></View>}
          {!!newsError && <View style={styles.newsError}><Text style={styles.newsErrorText}>{newsError}</Text><Pressable onPress={runSiolNewsSkill} style={styles.retryButton}><Text style={styles.retryText}>Zaženi znova</Text></Pressable></View>}
          {!!news.length && <View style={styles.agentNewsCard}>
            <Text style={styles.agentNewsHeading}>5 najnovejših novic</Text>
            {news.map((item, index) => <Pressable key={item.url} onPress={() => Linking.openURL(item.url)} style={styles.agentNewsItem}>
              <Text style={styles.newsNumber}>{String(index + 1).padStart(2, '0')}</Text>
              <View style={styles.newsCopy}><Text style={styles.agentNewsTitle}>{item.title}</Text><Text style={styles.newsLink}>Siol.net ↗</Text></View>
            </Pressable>)}
          </View>}
        </> : <View style={styles.timeline}>
            <TimelineStep number={1} agent="jotaro" title="Analyzing task" description="Understanding what needs to be done..." time="9:41 AM" progress={28} color="#86ce42" />
            <TimelineStep number={2} agent="giorno" title="Processing" description="Gathering information and preparing solution..." time="9:42 AM" progress={60} color="#2d8ddd" />
            <TimelineStep number={3} agent="jolyne" title="Generating" description="Creating content..." time="9:43 AM" progress={54} color="#2d8ddd" />
            <TimelineStep number={4} agent="dio" title="Finalizing" description="Putting everything together..." time="9:44 AM" progress={0} color="#d5d5d5" last />
          </View>}
      </ScrollView>
      <View style={styles.messageBar}><TextInput value={task} onChangeText={setTask} placeholder="Message the agent..." placeholderTextColor="#9d9d9d" style={styles.messageInput} /><CubeButton compact onPress={() => setTask('')} /></View>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.galleryHeader}>
      <View style={styles.galleryTabs} accessibilityRole="tablist">
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: galleryTab === 'agents' }} onPress={() => setGalleryTab('agents')} style={[styles.galleryTab, galleryTab === 'agents' && styles.galleryTabActive]}>
          <Text style={[styles.galleryTabText, galleryTab === 'agents' && styles.galleryTabTextActive]}>Agents</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: galleryTab === 'skills' }} onPress={() => setGalleryTab('skills')} style={[styles.galleryTab, galleryTab === 'skills' && styles.galleryTabActive]}>
          <Text style={[styles.galleryTabText, galleryTab === 'skills' && styles.galleryTabTextActive]}>Skills</Text>
        </Pressable>
      </View>
    </View>
    <ScrollView contentContainerStyle={styles.galleryGrid} showsVerticalScrollIndicator={false}>
      {galleryTab === 'agents'
        ? <>
          {agentRows.map((row, rowIndex) => <View key={rowIndex} style={styles.galleryRow}>
          {row.map((agent) => <Pressable key={agent} onPress={() => toggleAgent(agent)} style={[styles.agentTile, selected.includes(agent) && styles.agentTileSelected]}>
            <AnimatedAgentSprite name={agent} />
            <Text style={styles.tileLabel} numberOfLines={1}>{agentNames[agent]}</Text>
            {agent === 'jotaro' && <View style={styles.jotaroSkillBadge}><Text style={styles.jotaroSkillBadgeText}>SIOL SKILL</Text></View>}
          </Pressable>)}
          </View>)}
          {makeRows(createdAgents).map((row, rowIndex) => <View key={rowIndex} style={styles.galleryRow}>
            {row.map((agent) => <Pressable key={agent.id} onPress={() => toggleAgent(agent.sprite)} style={[styles.agentTile, selected.includes(agent.sprite) && styles.agentTileSelected]}>
              <AnimatedAgentSprite name={agent.sprite} />
              <Text style={styles.tileLabel} numberOfLines={1}>{agent.name}</Text>
            </Pressable>)}
          </View>)}
        </>
        : <>
          <View style={styles.galleryRow}>
            <Pressable onPress={() => toggleAgent('jotaro')} style={[styles.agentTile, selected.includes('jotaro') && styles.agentTileSelected]}>
              <AnimatedAgentSprite name="jotaro" />
              <Text style={styles.tileLabel} numberOfLines={1}>Jotaro</Text>
              <View style={styles.jotaroSkillBadge}><Text style={styles.jotaroSkillBadgeText}>SIOL SKILL</Text></View>
            </Pressable>
          </View>
          {skillRows.map((row, rowIndex) => <View key={rowIndex} style={styles.galleryRow}>
          {row.map((skill) => <View key={skill} style={styles.agentTile}>
            <AnimatedSkillSprite name={skill} />
            <Text style={styles.tileLabel} numberOfLines={1}>{skillNames[skill]}</Text>
          </View>)}
          </View>)}
          {makeRows(createdSkills).map((row, rowIndex) => <View key={rowIndex} style={styles.galleryRow}>
            {row.map((skill) => <View key={skill.id} style={styles.agentTile}>
              <AnimatedSkillSprite name={skill.sprite} />
              <Text style={styles.tileLabel} numberOfLines={1}>{skill.name}</Text>
            </View>)}
          </View>)}
        </>}
    </ScrollView>
    <View style={styles.galleryFooter}>
      <Pressable accessibilityRole="button" onPress={openCreator} style={styles.addItemButton}>
        <Text style={styles.addItemText}>＋ Add {galleryTab === 'agents' ? 'agent' : 'skill'}</Text>
      </Pressable>
      <View style={styles.galleryTaskRow}>
        <TextInput
          value={task}
          onChangeText={setTask}
          placeholder="Describe a task..."
          placeholderTextColor="#9d9d9d"
          style={styles.galleryTaskInput}
        />
        <View style={styles.galleryCube}><CubeButton onPress={openWorkspace} /></View>
      </View>
    </View>
  </SafeAreaView>;
}

function TimelineStep({ agent, title, description, time, progress, color, last }: { number: number; agent: SpriteName; title: string; description: string; time: string; progress: number; color: string; last?: boolean }) {
  return <View style={styles.timelineStep}>
    <View style={styles.timelineRail}><View style={[styles.timelineDot, { borderColor: color, backgroundColor: color }]} />{!last && <View style={styles.timelineLine} />}</View>
    <AgentSprite name={agent} style={styles.stepSprite} />
    <View style={styles.stepCopy}><View style={styles.stepTitleRow}><Text style={styles.stepTitle}>Step {title === 'Analyzing task' ? '1' : title === 'Processing' ? '2' : title === 'Generating' ? '3' : '4'}: {title}</Text><Text style={styles.time}>{time}</Text></View><Text style={styles.stepDescription}>{description}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` as `${number}%`, backgroundColor: color }]} /></View></View>
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcfbf7' },
  creatorPage: { paddingHorizontal: 30, paddingTop: 18, paddingBottom: 48 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 14 },
  backText: { color: '#4c4c4b', fontSize: 16, fontWeight: '700' },
  creatorTitle: { color: '#292929', fontSize: 32, letterSpacing: -1, fontWeight: '900', marginTop: 28 },
  creatorSubtitle: { color: '#70706e', fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 300 },
  fieldLabel: { color: '#666663', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 30, marginBottom: 9 },
  creatorInput: { minHeight: 54, paddingHorizontal: 16, fontSize: 15, color: '#353535', backgroundColor: '#fffefa', borderRadius: 14, borderWidth: 1, borderColor: '#bdbdb9' },
  creatorDescription: { height: 150, paddingTop: 15 },
  characterPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, characterOption: { width: 58, height: 58, borderRadius: 12, borderWidth: 1, borderColor: '#c8c8c4', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffefa' }, characterOptionSelected: { borderColor: '#2d8ddd', borderWidth: 2, backgroundColor: '#edf8ff' }, characterOptionSprite: { width: 48, height: 48 },
  saveButton: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 30, backgroundColor: '#292929' },
  saveButtonDisabled: { backgroundColor: '#a9a9a6' },
  saveButtonText: { color: '#fffefa', fontSize: 16, fontWeight: '800' },
  galleryHeader: { height: 80, paddingHorizontal: 30, paddingTop: 0, borderBottomWidth: 1, borderColor: '#d9d8d4', justifyContent: 'center' },
  galleryTabs: { height: 44, flexDirection: 'row', alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, borderColor: '#d9d8d4', backgroundColor: '#f6f5f1', padding: 4 },
  galleryTab: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  galleryTabActive: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#d1d0cc' },
  galleryTabText: { color: '#858585', fontWeight: '800', fontSize: 17 },
  galleryTabTextActive: { color: '#292929' },
  galleryGrid: { paddingHorizontal: 30, paddingTop: 36, paddingBottom: 105, gap: 24 }, galleryRow: { flexDirection: 'row', gap: 24 },
  agentTile: { flex: 1, aspectRatio: .82, backgroundColor: '#fdfcf8', borderWidth: 2, borderColor: '#d9d8d4', borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  agentTileSpacer: { flex: 1, aspectRatio: .82 },
  agentTileSelected: { borderColor: '#79b95a', backgroundColor: '#fbfff8' },
  sprite: { width: 190, height: 190 }, animatedSprite: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }, gallerySprite: { width: '80%', height: '72%', marginTop: 28 },
  tileLabel: { position: 'absolute', top: 7, left: 8, right: 8, zIndex: 2, color: '#292929', fontFamily: 'monospace', fontSize: 10, fontWeight: '900', letterSpacing: 1, textAlign: 'center', textShadowColor: '#d5d5d2', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
  jotaroSkillBadge: { position: 'absolute', bottom: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#292929' },
  jotaroSkillBadgeText: { color: '#fffefa', fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  addItemButton: { height: 42, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: '#aaa9a5', alignItems: 'center', justifyContent: 'center' },
  addItemText: { color: '#4c4c4b', fontWeight: '800', fontSize: 15 },
  skillHint: { position: 'absolute', bottom: 10, color: '#75a958', fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  galleryFooter: { height: 150, paddingHorizontal: 30, paddingTop: 8, justifyContent: 'space-between', backgroundColor: '#fcfbf7' },
  galleryTaskRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  galleryTaskInput: { flex: 1, height: 60, paddingHorizontal: 18, fontSize: 15, color: '#353535', backgroundColor: '#fffefa', borderRadius: 18, borderWidth: 1, borderColor: '#bdbdb9' },
  galleryCube: { marginBottom: -10 },
  cubeButton: { width: 75, height: 75, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: 'transparent', flexShrink: 0 },
  cubeButtonCompact: { height: 48, width: 48, borderRadius: 24 }, cubeCrop: { width: '100%', height: '100%', overflow: 'hidden', borderRadius: 999 }, cubeImage: { position: 'absolute', width: '130%', height: '130%', left: '-15%', top: '-15%' },
  // The workspace is shown in a 2x iPhone capture. Keep the generous page
  // gutters, but use point-sized controls so the conversation fits comfortably.
  workspace: { paddingHorizontal: 30, paddingTop: 24, paddingBottom: 78 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 }, selectedAgents: { flexDirection: 'row', gap: 5 },
  selectedAgent: { height: 48, width: 48, borderWidth: 1, borderColor: '#bdbdb9', borderRadius: 8, overflow: 'visible', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffefa' },
  selectedSprite: { height: 38, width: 38 }, remove: { position: 'absolute', right: -6, top: -7, height: 15, width: 15, borderRadius: 8, backgroundColor: '#828282', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#656565' }, removeText: { fontSize: 14, color: 'white', lineHeight: 15 },
  workspaceTaskInput: { minWidth: 0, height: 60, paddingHorizontal: 12, fontSize: 12, borderRadius: 12 },
  workingCard: { marginTop: 26, borderRadius: 13, borderWidth: 1, borderColor: '#d7d6d2', backgroundColor: '#fffefa', minHeight: 90, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, workingSprite: { width: 68, height: 68 }, workingCopy: { flex: 1, minWidth: 0 }, workingTitle: { color: '#292929', fontWeight: '800', fontSize: 12 }, thinking: { marginTop: 6, color: '#929292', fontSize: 11 }, dots: { fontSize: 6, letterSpacing: 2, color: '#969696' },
  modelProgressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e4e3df', marginTop: 8 },
  modelProgressFill: { height: '100%', borderRadius: 4, backgroundColor: '#79b95a' },
  aiAnswerCard: { marginTop: 10, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#b9d7a9', backgroundColor: '#f8fff4' },
  aiAnswerLabel: { color: '#56883b', fontFamily: 'monospace', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  aiAnswerText: { color: '#292929', fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 9 },
  agentNewsCard: { marginTop: 10, paddingHorizontal: 16, paddingTop: 16, borderRadius: 14, borderWidth: 1, borderColor: '#d7d6d2', backgroundColor: '#fffefa' },
  agentNewsHeading: { color: '#292929', fontSize: 16, fontWeight: '900', marginBottom: 3 },
  agentNewsItem: { flexDirection: 'row', gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e2e1dd' },
  agentNewsTitle: { color: '#292929', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  timeline: { marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#d7d6d2', backgroundColor: '#fffefa', paddingVertical: 15, paddingRight: 9 },
  timelineStep: { minHeight: 101, flexDirection: 'row' }, timelineRail: { width: 24, alignItems: 'center', paddingTop: 6 }, timelineDot: { height: 11, width: 11, borderRadius: 6, borderWidth: 1 }, timelineLine: { position: 'absolute', top: 17, height: 93, width: 1, backgroundColor: '#c9c9c7' }, stepSprite: { height: 58, width: 58, marginTop: 2 }, stepCopy: { paddingTop: 6, flex: 1, minWidth: 0 }, stepTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 }, stepTitle: { color: '#292929', fontSize: 12, fontWeight: '800', flexShrink: 1 }, time: { color: '#909090', fontSize: 9 }, stepDescription: { color: '#696969', fontSize: 10, lineHeight: 14, marginTop: 6, maxWidth: 145 }, progressTrack: { height: 12, overflow: 'hidden', borderRadius: 6, borderWidth: 1, borderColor: '#d2d2cf', marginTop: 8, backgroundColor: '#f8f7f3' }, progressFill: { height: '100%', borderRadius: 4 },
  messageBar: { position: 'absolute', bottom: 12, left: 30, right: 30, minHeight: 50, borderRadius: 25, borderWidth: 1, borderColor: '#bdbdb9', backgroundColor: '#fffefa', paddingLeft: 14, paddingRight: 5, alignItems: 'center', flexDirection: 'row', gap: 5 }, messageInput: { flex: 1, minWidth: 0, fontSize: 12, color: '#333' },
  newsPage: { paddingHorizontal: 30, paddingTop: 18, paddingBottom: 48 },
  newsHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  newsHeadingCopy: { flex: 1 }, newsSprite: { width: 72, height: 72 },
  newsStatus: { marginTop: 28, color: '#70706e', fontSize: 15 },
  newsError: { marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#fff0ed', borderWidth: 1, borderColor: '#e8b4aa' },
  newsErrorText: { color: '#8b392e', fontSize: 14, lineHeight: 20 },
  retryButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#292929' },
  retryText: { color: '#fffefa', fontWeight: '800', fontSize: 13 },
  newsItem: { flexDirection: 'row', gap: 14, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#d9d8d4' },
  newsNumber: { color: '#75a958', fontFamily: 'monospace', fontSize: 14, fontWeight: '900', paddingTop: 2 },
  newsCopy: { flex: 1 }, newsTitle: { color: '#292929', fontSize: 17, lineHeight: 23, fontWeight: '800' },
  newsLink: { color: '#2d8ddd', fontSize: 12, fontWeight: '800', marginTop: 8 },
  refreshButton: { height: 52, marginTop: 24, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#292929' },
  refreshText: { color: '#fffefa', fontSize: 15, fontWeight: '800' },
});
