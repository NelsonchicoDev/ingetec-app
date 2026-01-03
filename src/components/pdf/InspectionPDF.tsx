/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Section, CustomField } from '@/types';

interface PDFProps {
    inspection: {
        id: string;
        createdAt: string;
        company: { name: string; rut: string };
        worker: {
            name: string;
            role: string;
            rut?: string | null;
            secRegistrationNumber?: string | null;
            digitalSignature?: string | null;
        };
        template: { title: string; customFields: CustomField[] };
        checklistData: Section[];
        customValues: Record<string, string | number | boolean | null | undefined>;
        score: number;
    };
}

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },

    // Header
    header: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 },
    headerText: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
    subTitle: { fontSize: 10, color: '#666' },
    scoreBox: { alignItems: 'flex-end' },
    scoreNum: { fontSize: 20, fontWeight: 'bold' },

    // Datos Generales
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, border: '1px solid #000', padding: 5, backgroundColor: '#f9f9f9' },
    gridItem: { width: '33%', padding: 4 },
    label: { fontSize: 8, color: '#666', marginBottom: 2, textTransform: 'uppercase' },
    value: { fontSize: 10, fontWeight: 'bold' },

    // Checklist
    sectionTitle: { marginTop: 10, marginBottom: 5, fontSize: 12, fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: 4, border: '1px solid #000' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderLeftWidth: 1, borderTopWidth: 1, borderColor: '#000' },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },

    // Columnas
    colItem: { width: '40%', borderStyle: 'solid', borderRightWidth: 1, borderBottomWidth: 1, padding: 3 },
    colCheck: { width: '10%', borderStyle: 'solid', borderRightWidth: 1, borderBottomWidth: 1, padding: 3, textAlign: 'center' },
    colObs: { width: '30%', borderStyle: 'solid', borderRightWidth: 1, borderBottomWidth: 1, padding: 3 },

    // Firmas & Timbre
    signatures: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    signatureBox: { width: '30%', alignItems: 'center' },
    line: { borderTopWidth: 1, borderColor: '#000', width: '100%', marginTop: 2, marginBottom: 4 },

    // Estilos del Timbre Virtual
    stampContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 70, marginBottom: 5 },
    stampName: { fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
    stampInfo: { fontSize: 8, fontFamily: 'Helvetica', textAlign: 'center' },
    stampRole: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2, textAlign: 'center' },

    // La firma superpuesta
    stampOverlay: { position: 'absolute', top: -10, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    stampImage: { width: 100, height: 60, objectFit: 'contain', opacity: 0.85 } // Un poco transparente
});

export const InspectionPDF = ({ inspection }: PDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* 1. HEADER */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{inspection.template.title}</Text>
                    <Text style={styles.subTitle}>Empresa: {inspection.company.name}</Text>
                    <Text style={styles.subTitle}>Fecha: {new Date(inspection.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreNum}>{inspection.score}%</Text>
                    <Text style={{ fontSize: 8 }}>Cumplimiento</Text>
                </View>
            </View>

            {/* 2. DATOS ENCABEZADO */}
            <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>INSPECTOR</Text>
                    <Text style={styles.value}>{inspection.worker.name}</Text>
                </View>
                {inspection.template.customFields.map((field) => (
                    <View key={field.id} style={styles.gridItem}>
                        <Text style={styles.label}>{field.label}</Text>
                        <Text style={styles.value}>{inspection.customValues[field.id] || '-'}</Text>
                    </View>
                ))}
            </View>

            {/* 3. CHECKLIST */}
            {inspection.checklistData.map((section, index) => (
                <View key={index} wrap={false}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.table}>
                        {/* Header Tabla */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={styles.colItem}>PUNTO A REVISAR</Text>
                            <Text style={styles.colCheck}>B</Text>
                            <Text style={styles.colCheck}>M</Text>
                            <Text style={styles.colCheck}>N/A</Text>
                            <Text style={styles.colObs}>OBSERVACIÓN</Text>
                        </View>
                        {/* Items */}
                        {(section.items || []).map((item, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.colItem}>{item.text}</Text>
                                <Text style={styles.colCheck}>{item.answer === 'B' ? 'X' : ''}</Text>
                                <Text style={styles.colCheck}>{item.answer === 'M' ? 'X' : ''}</Text>
                                <Text style={styles.colCheck}>{item.answer === 'N/A' ? 'X' : ''}</Text>
                                <Text style={styles.colObs}>{item.type === 'TEXT' ? item.answer : ''}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}

            {/* 4. FIRMAS Y TIMBRE */}
            <View style={styles.signatures}>

                {/* CAJA 1: RESPONSABLE (CON TIMBRE) */}
                <View style={styles.signatureBox}>
                    {inspection.worker.digitalSignature ? (
                        <View style={styles.stampContainer}>
                            {/* Capa Texto */}
                            <Text style={styles.stampName}>{inspection.worker.name}</Text>
                            {inspection.worker.rut && <Text style={styles.stampInfo}>{inspection.worker.rut}</Text>}
                            {inspection.worker.secRegistrationNumber && <Text style={styles.stampInfo}>{inspection.worker.secRegistrationNumber}</Text>}
                            <Text style={styles.stampRole}>{inspection.worker.role.toUpperCase()}</Text>

                            {/* Capa Firma (Encima) */}
                            <View style={styles.stampOverlay}>
                                <Image src={inspection.worker.digitalSignature} style={styles.stampImage} />
                            </View>
                        </View>
                    ) : (
                        <View style={{ height: 70 }} />
                    )}
                    <View style={styles.line} />
                    <Text style={{ fontSize: 8 }}>FIRMA RESPONSABLE</Text>
                </View>

                {/* CAJA 2: SUPERVISOR */}
                <View style={styles.signatureBox}>
                    <View style={{ height: 70 }} />
                    <View style={styles.line} />
                    <Text style={{ fontSize: 8 }}>V°B° SUPERVISOR</Text>
                </View>

                {/* CAJA 3: PREVENCIÓN */}
                <View style={styles.signatureBox}>
                    <View style={{ height: 70 }} />
                    <View style={styles.line} />
                    <Text style={{ fontSize: 8 }}>V°B° PREVENCIÓN</Text>
                </View>
            </View>

        </Page>
    </Document>
);