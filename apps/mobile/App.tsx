import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { llmService, MODEL_ID } from './src/services/llmService';
import type { Agent, AgentResult } from '@8x/shared-types';

const starter: Agent[] = [{
  id: 'daily-news', name: 'Današnje novice',
  description: 'Poišče glavne novice in vrne pet kratkih povzetkov.',
  startUrl: 'https://siol.net', allowedSkills: ['web.fetch', 'web.extract', 'summarize'],
}];
const skills = ['web.fetch', 'web.extract', 'summarize'];

export default function App() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState(starter);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Agent>();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentResult>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('https://');
  const [chosenSkills, setChosenSkills] = useState(skills);

  const install = async () => {
    setLoading(true); await llmService.loadModel(MODEL_ID); setReady(true); setLoading(false);
  };
  const run = async (agent: Agent) => {
    setSelected(agent); setRunning(true); setResult(undefined);
    const output = await llmService.generate([{ role: 'user', content: agent.description + '\nURL: ' + agent.startUrl }]);
    const next: AgentResult = { summary: output.replace('[mock] received: ', ''), links: [agent.startUrl], createdAt: new Date().toISOString() };
    setResult(next); setRunning(false);
    setAgents((all) => all.map((item) => item.id === agent.id ? { ...item, lastRunAt: next.createdAt, lastResult: next } : item));
  };
  const create = () => {
    if (!name.trim() || !description.trim() || !url.trim()) return;
    setAgents((all) => [{ id: 'agent-' + Date.now(), name: name.trim(), description: description.trim(), startUrl: url.trim(), allowedSkills: chosenSkills }, ...all]);
    setName(''); setDescription(''); setUrl('https://'); setCreating(false);
  };

  if (!ready) return <SafeAreaView style={styles.safe}><StatusBar style="light" /><View style={styles.center}>
    <Text style={styles.logo}>local<Text style={styles.accent}>agent</Text></Text>
    <Text style={styles.hero}>Tvoji agenti.{'\n'}Na tvoji napravi.</Text>
    <Text style={styles.centerText}>Qwen3 1.7B bo deloval lokalno. Tvoji podatki ne bodo zapustili naprave.</Text>
    <View style={styles.model}><View><Text style={styles.cardTitle}>Qwen3 1.7B</Text><Text style={styles.muted}>MLX · 4-bit · približno 1,1 GB</Text></View><Text style={styles.accent}>✦</Text></View>
    <Pressable style={styles.primary} onPress={install} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Pripravljam model …' : 'Naloži lokalni model'}</Text>{loading && <ActivityIndicator color="#07111f" />}</Pressable>
    <Text style={styles.note}>Prenos je potreben samo ob prvem zagonu.</Text>
  </View></SafeAreaView>;

  if (creating) return <SafeAreaView style={styles.safe}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.page}>
    <Pressable onPress={() => setCreating(false)}><Text style={styles.back}>‹ Nazaj</Text></Pressable>
    <Text style={styles.title}>Nov agent</Text><Text style={styles.subtitle}>Opiši, kaj naj agent naredi.</Text>
    <Text style={styles.label}>IME</Text><TextInput style={styles.input} placeholder="npr. Jutranji pregled" placeholderTextColor="#66809a" value={name} onChangeText={setName} />
    <Text style={styles.label}>NALOGA</Text><TextInput style={[styles.input, styles.multiline]} multiline placeholder="Kaj naj agent poišče in pripravi?" placeholderTextColor="#66809a" value={description} onChangeText={setDescription} />
    <Text style={styles.label}>ZAČETNI URL</Text><TextInput style={styles.input} autoCapitalize="none" value={url} onChangeText={setUrl} />
    <Text style={styles.label}>DOVOLJENE VEŠČINE</Text><View style={styles.wrap}>{skills.map((skill) => <Pressable key={skill} onPress={() => setChosenSkills((all) => all.includes(skill) ? all.filter((x) => x !== skill) : [...all, skill])} style={[styles.skill, chosenSkills.includes(skill) && styles.activeSkill]}><Text style={styles.skillText}>{skill}</Text></Pressable>)}</View>
    <Pressable style={styles.primary} onPress={create}><Text style={styles.primaryText}>Ustvari agenta</Text></Pressable>
  </ScrollView></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><StatusBar style="light" /><ScrollView contentContainerStyle={styles.page}>
    <View style={styles.header}><View><Text style={styles.logo}>local<Text style={styles.accent}>agent</Text></Text><Text style={styles.muted}>Lokalna inteligenca</Text></View><View style={styles.badge}><Text style={styles.badgeText}>● MODEL READY</Text></View></View>
    <View style={styles.greeting}><Text style={styles.eyebrow}>TVOJI AGENTI</Text><Text style={styles.title}>Kaj boš danes raziskal?</Text></View>
    {agents.map((agent) => <Pressable key={agent.id} style={styles.agent} onPress={() => run(agent)}><View style={styles.icon}><Text style={styles.accent}>✦</Text></View><View style={styles.agentBody}><Text style={styles.cardTitle}>{agent.name}</Text><Text style={styles.agentDescription}>{agent.description}</Text><Text style={styles.url}>{agent.startUrl}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}
    <Pressable style={styles.createCard} onPress={() => setCreating(true)}><Text style={styles.plus}>＋</Text><View><Text style={styles.cardTitle}>Ustvari novega agenta</Text><Text style={styles.muted}>Določi nalogo in dovoljene veščine</Text></View></Pressable>
    {selected && <View style={styles.resultCard}><Text style={styles.eyebrow}>ZADNJI ZAGON · {selected.name.toUpperCase()}</Text>{running ? <Text style={styles.running}>Agent obdeluje podatke …</Text> : result && <><Text style={styles.result}>{result.summary}</Text><Text style={styles.url}>↗ {result.links[0]}</Text></>}</View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07111f' }, page: { padding: 24, paddingBottom: 60 }, center: { flex: 1, padding: 28, justifyContent: 'center' },
  logo: { color: '#f3f7fb', fontSize: 22, fontWeight: '800' }, accent: { color: '#71e5bd' }, hero: { color: '#f3f7fb', fontSize: 38, lineHeight: 43, fontWeight: '800', textAlign: 'center', marginTop: 38 },
  centerText: { color: '#9ab0c4', fontSize: 15, lineHeight: 23, textAlign: 'center', marginVertical: 24 }, model: { padding: 18, borderRadius: 16, backgroundColor: '#102034', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  primary: { backgroundColor: '#71e5bd', minHeight: 54, borderRadius: 14, marginTop: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, primaryText: { color: '#07111f', fontSize: 16, fontWeight: '800' }, note: { color: '#66809a', fontSize: 12, textAlign: 'center', marginTop: 16 },
  muted: { color: '#7790a7', fontSize: 13, marginTop: 5 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, badge: { backgroundColor: '#102b31', padding: 8, borderRadius: 20 }, badgeText: { color: '#71e5bd', fontSize: 10, fontWeight: '800' }, greeting: { marginTop: 60, marginBottom: 20 },
  eyebrow: { color: '#71e5bd', fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }, title: { color: '#f3f7fb', fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 8 }, subtitle: { color: '#9ab0c4', fontSize: 15, marginTop: 8 },
  agent: { backgroundColor: '#102034', padding: 17, borderRadius: 18, flexDirection: 'row', marginBottom: 12 }, icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#1b3b46', alignItems: 'center', justifyContent: 'center' }, agentBody: { flex: 1, marginLeft: 13 }, cardTitle: { color: '#f3f7fb', fontSize: 16, fontWeight: '700' }, agentDescription: { color: '#9ab0c4', fontSize: 13, lineHeight: 19, marginTop: 5 }, url: { color: '#71e5bd', fontSize: 12, marginTop: 10 }, arrow: { color: '#66809a', fontSize: 28 },
  createCard: { borderWidth: 1, borderColor: '#27405a', borderStyle: 'dashed', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center' }, plus: { color: '#71e5bd', fontSize: 27, marginRight: 12 }, resultCard: { backgroundColor: '#0d292d', borderRadius: 18, padding: 18, marginTop: 22 }, running: { color: '#b9d1db', marginTop: 15 }, result: { color: '#d8f5ec', fontSize: 15, lineHeight: 23, marginTop: 15 },
  back: { color: '#71e5bd', fontSize: 16, marginBottom: 34 }, label: { color: '#7790a7', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 24, marginBottom: 8 }, input: { backgroundColor: '#102034', color: '#f3f7fb', borderRadius: 13, padding: 15, fontSize: 15 }, multiline: { minHeight: 110, textAlignVertical: 'top' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, skill: { borderWidth: 1, borderColor: '#2a435d', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 }, activeSkill: { backgroundColor: '#1b4d4d', borderColor: '#71e5bd' }, skillText: { color: '#9ab0c4', fontSize: 12 },
});
