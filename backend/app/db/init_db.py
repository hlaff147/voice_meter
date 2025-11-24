"""
Database initialization and mock data seeding
"""
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.base import Base, engine
from app.models.recording import Recording, UserStatistics


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def seed_mock_data(db: Session):
    """Seed the database with mock recordings for demonstration"""
    
    # Check if data already exists
    existing_count = db.query(Recording).count()
    if existing_count > 0:
        print(f"⚠️  Database already has {existing_count} recordings. Skipping seed.")
        return
    
    # Mock recordings data based on screens 7, 8, 9
    mock_recordings = [
        # Today's recording - highest score
        {
            "created_at": datetime.now(),
            "title": "Apresentação do Projeto Final",
            "category": "presentation",
            "duration_seconds": 200.0,
            "words_per_minute": 145.0,
            "speech_rate": 140.0,
            "articulation_rate": 145.0,
            "ideal_min_ppm": 140,
            "ideal_max_ppm": 160,
            "is_within_range": True,
            "active_speech_time": 185.0,
            "silence_ratio": 0.075,
            "pause_count": 12,
            "avg_pause_duration": 1.25,
            "pacing_consistency": 0.92,
            "local_variation_detected": False,
            "intelligibility_score": 0.95,
            "overall_score": 92,
            "feedback": "Excelente! Sua velocidade está ideal para apresentações. Continue assim!",
            "confidence": 0.95,
            "volume_min_db": 58.0,
            "volume_max_db": 75.0,
            "volume_avg_db": 68.0,
            "volume_data_json": json.dumps([60, 65, 70, 72, 68, 75, 70, 65, 68, 72, 70, 68]),
            "recommendations": json.dumps([
                "Mantenha a consistência no ritmo que está excelente",
                "Pausas estratégicas bem posicionadas",
                "Volume e clareza ideais para o contexto"
            ]),
            "patterns_identified": json.dumps([
                "Ritmo consistente ao longo da apresentação",
                "Boa distribuição de pausas",
                "Volume equilibrado sem picos bruscos"
            ]),
            "notes": "Ensaio final para apresentação da universidade"
        },
        # Yesterday - good score
        {
            "created_at": datetime.now() - timedelta(days=1, hours=5, minutes=15),
            "title": "Pitch de Vendas - Cliente ABC",
            "category": "pitch",
            "duration_seconds": 345.0,
            "words_per_minute": 138.0,
            "speech_rate": 132.0,
            "articulation_rate": 138.0,
            "ideal_min_ppm": 120,
            "ideal_max_ppm": 150,
            "is_within_range": True,
            "active_speech_time": 310.0,
            "silence_ratio": 0.10,
            "pause_count": 18,
            "avg_pause_duration": 1.94,
            "pacing_consistency": 0.85,
            "local_variation_detected": True,
            "intelligibility_score": 0.88,
            "overall_score": 85,
            "feedback": "Muito bom! Velocidade adequada para pitch. Algumas variações de ritmo detectadas.",
            "confidence": 0.88,
            "volume_min_db": 55.0,
            "volume_max_db": 78.0,
            "volume_avg_db": 66.0,
            "volume_data_json": json.dumps([58, 62, 68, 72, 65, 78, 68, 60, 70, 75, 68, 62]),
            "recommendations": json.dumps([
                "Tente manter ritmo mais uniforme em seções críticas",
                "Pausas um pouco longas em alguns momentos",
                "Considere reduzir velocidade em pontos complexos"
            ]),
            "patterns_identified": json.dumps([
                "Aceleração detectada em partes técnicas",
                "Pausas mais longas antes de argumentos principais",
                "Variação de volume apropriada para ênfase"
            ])
        },
        # 2 days ago - moderate score
        {
            "created_at": datetime.now() - timedelta(days=2, hours=10, minutes=30),
            "title": "Ensaio de Conversação",
            "category": "conversation",
            "duration_seconds": 180.0,
            "words_per_minute": 115.0,
            "speech_rate": 108.0,
            "articulation_rate": 115.0,
            "ideal_min_ppm": 100,
            "ideal_max_ppm": 130,
            "is_within_range": True,
            "active_speech_time": 168.0,
            "silence_ratio": 0.067,
            "pause_count": 8,
            "avg_pause_duration": 1.5,
            "pacing_consistency": 0.78,
            "local_variation_detected": True,
            "intelligibility_score": 0.82,
            "overall_score": 78,
            "feedback": "Bom para conversação! Algumas áreas podem ser melhoradas.",
            "confidence": 0.82,
            "volume_min_db": 52.0,
            "volume_max_db": 70.0,
            "volume_avg_db": 62.0,
            "volume_data_json": json.dumps([55, 58, 62, 65, 60, 70, 62, 58, 60, 65, 62, 60]),
            "recommendations": json.dumps([
                "Aumente ligeiramente a consistência do ritmo",
                "Volume um pouco baixo - tente falar mais alto",
                "Adicione mais pausas estratégicas"
            ]),
            "patterns_identified": json.dumps([
                "Ritmo variável detectado",
                "Poucas pausas para o tamanho da fala",
                "Volume consistente mas abaixo do ideal"
            ])
        },
        # 4 days ago - excellent score
        {
            "created_at": datetime.now() - timedelta(days=4, hours=14),
            "title": "Treinamento de Oratória",
            "category": "presentation",
            "duration_seconds": 270.0,
            "words_per_minute": 152.0,
            "speech_rate": 148.0,
            "articulation_rate": 152.0,
            "ideal_min_ppm": 140,
            "ideal_max_ppm": 160,
            "is_within_range": True,
            "active_speech_time": 255.0,
            "silence_ratio": 0.056,
            "pause_count": 15,
            "avg_pause_duration": 1.0,
            "pacing_consistency": 0.95,
            "local_variation_detected": False,
            "intelligibility_score": 0.96,
            "overall_score": 95,
            "feedback": "Excepcional! Performance de alto nível em todas as métricas.",
            "confidence": 0.96,
            "volume_min_db": 62.0,
            "volume_max_db": 76.0,
            "volume_avg_db": 70.0,
            "volume_data_json": json.dumps([65, 68, 72, 70, 68, 76, 72, 68, 70, 74, 72, 68]),
            "recommendations": json.dumps([
                "Performance excelente - mantenha esse padrão",
                "Ritmo e clareza impecáveis",
                "Exemplo de boa oratória"
            ]),
            "patterns_identified": json.dumps([
                "Consistência exemplar do início ao fim",
                "Pausas perfeitamente distribuídas",
                "Volume ideal para apresentação formal"
            ])
        },
        # 1 week ago
        {
            "created_at": datetime.now() - timedelta(days=7, hours=9),
            "title": "Reunião com Stakeholders",
            "category": "pitch",
            "duration_seconds": 420.0,
            "words_per_minute": 128.0,
            "speech_rate": 122.0,
            "articulation_rate": 128.0,
            "ideal_min_ppm": 120,
            "ideal_max_ppm": 150,
            "is_within_range": True,
            "active_speech_time": 390.0,
            "silence_ratio": 0.071,
            "pause_count": 22,
            "avg_pause_duration": 1.36,
            "pacing_consistency": 0.80,
            "local_variation_detected": True,
            "intelligibility_score": 0.84,
            "overall_score": 81,
            "feedback": "Bom ritmo para reuniões. Algumas variações podem ser ajustadas.",
            "confidence": 0.84,
            "volume_min_db": 56.0,
            "volume_max_db": 74.0,
            "volume_avg_db": 65.0,
            "volume_data_json": json.dumps([58, 62, 65, 68, 65, 74, 68, 62, 65, 70, 68, 64]),
            "recommendations": json.dumps([
                "Reduza variação de ritmo em explicações técnicas",
                "Pausas bem distribuídas - continue assim",
                "Volume adequado para reuniões"
            ]),
            "patterns_identified": json.dumps([
                "Pequenas acelerações em momentos de pressão",
                "Boa gestão de pausas",
                "Volume estável"
            ])
        },
        # 10 days ago - lower score
        {
            "created_at": datetime.now() - timedelta(days=10, hours=16),
            "title": "Primeiro Teste",
            "category": "other",
            "duration_seconds": 130.0,
            "words_per_minute": 105.0,
            "speech_rate": 98.0,
            "articulation_rate": 105.0,
            "ideal_min_ppm": 110,
            "ideal_max_ppm": 140,
            "is_within_range": False,
            "active_speech_time": 121.0,
            "silence_ratio": 0.069,
            "pause_count": 6,
            "avg_pause_duration": 1.5,
            "pacing_consistency": 0.65,
            "local_variation_detected": True,
            "intelligibility_score": 0.72,
            "overall_score": 68,
            "feedback": "Primeira tentativa! Há espaço para melhorias significativas.",
            "confidence": 0.72,
            "volume_min_db": 50.0,
            "volume_max_db": 68.0,
            "volume_avg_db": 58.0,
            "volume_data_json": json.dumps([52, 55, 58, 62, 58, 68, 60, 55, 58, 62, 60, 56]),
            "recommendations": json.dumps([
                "Aumente a velocidade da fala gradualmente",
                "Trabalhe na consistência do ritmo",
                "Fale um pouco mais alto para melhor clareza",
                "Adicione mais pausas estratégicas"
            ]),
            "patterns_identified": json.dumps([
                "Ritmo abaixo do ideal para o contexto",
                "Inconsistências detectadas",
                "Volume baixo em vários momentos"
            ]),
            "notes": "Primeira gravação de teste - baseline"
        },
        # 15 days ago
        {
            "created_at": datetime.now() - timedelta(days=15, hours=11),
            "title": "Apresentação Inicial",
            "category": "presentation",
            "duration_seconds": 240.0,
            "words_per_minute": 142.0,
            "speech_rate": 138.0,
            "articulation_rate": 142.0,
            "ideal_min_ppm": 140,
            "ideal_max_ppm": 160,
            "is_within_range": True,
            "active_speech_time": 228.0,
            "silence_ratio": 0.05,
            "pause_count": 10,
            "avg_pause_duration": 1.2,
            "pacing_consistency": 0.88,
            "local_variation_detected": False,
            "intelligibility_score": 0.90,
            "overall_score": 88,
            "feedback": "Ótima apresentação! Ritmo muito bom.",
            "confidence": 0.90,
            "volume_min_db": 60.0,
            "volume_max_db": 74.0,
            "volume_avg_db": 67.0,
            "volume_data_json": json.dumps([62, 65, 68, 70, 67, 74, 70, 65, 68, 72, 70, 66]),
            "recommendations": json.dumps([
                "Excelente consistência",
                "Ritmo apropriado para apresentações",
                "Mantenha esse padrão"
            ]),
            "patterns_identified": json.dumps([
                "Ritmo constante e apropriado",
                "Pausas bem posicionadas",
                "Volume equilibrado"
            ])
        },
    ]
    
    # Insert mock recordings
    for recording_data in mock_recordings:
        recording = Recording(**recording_data)
        db.add(recording)
    
    # Create user statistics
    total_recordings = len(mock_recordings)
    avg_score = sum(r["overall_score"] for r in mock_recordings) / total_recordings
    
    # Evolution data for last 30 days (screen 9 chart)
    evolution_data = [
        {"date": (datetime.now() - timedelta(days=30)).isoformat(), "score": 65},
        {"date": (datetime.now() - timedelta(days=25)).isoformat(), "score": 68},
        {"date": (datetime.now() - timedelta(days=20)).isoformat(), "score": 72},
        {"date": (datetime.now() - timedelta(days=15)).isoformat(), "score": 78},
        {"date": (datetime.now() - timedelta(days=10)).isoformat(), "score": 82},
        {"date": (datetime.now() - timedelta(days=5)).isoformat(), "score": 88},
        {"date": datetime.now().isoformat(), "score": 92},
    ]
    
    user_stats = UserStatistics(
        total_recordings=total_recordings,
        total_duration_seconds=sum(r["duration_seconds"] for r in mock_recordings),
        average_score=avg_score,
        member_since=datetime.now() - timedelta(days=30),
        score_trend=5.0,  # +5 points this month
        recordings_this_week=2,
        recordings_this_month=total_recordings,
        best_score=95,
        best_score_date=datetime.now() - timedelta(days=4),
        evolution_data_json=json.dumps(evolution_data)
    )
    db.add(user_stats)
    
    db.commit()
    print(f"✅ Seeded {total_recordings} mock recordings and user statistics")


def init_db():
    """Initialize database with tables and mock data"""
    from app.db.base import SessionLocal
    
    print("🚀 Initializing database...")
    create_tables()
    
    db = SessionLocal()
    try:
        seed_mock_data(db)
        print("✅ Database initialization complete!")
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
