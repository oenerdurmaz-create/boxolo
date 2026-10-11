# -*- coding: utf-8 -*-
"""Erzeugt je Sprache eine Textdatei für App Store Connect und prüft die Grenzen."""
import os
import shutil

SCRATCH = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(SCRATCH, 'texte')

GRENZEN = {'promo': 170, 'keywords': 100, 'beschreibung': 4000, 'untertitel': 30}

SPRACHEN = [
    ('ar', 'Arabic'), ('zh', 'Chinese-Simplified'), ('nl', 'Dutch'),
    ('en', 'English-US'), ('fr', 'French'), ('de', 'German'),
    ('it', 'Italian'), ('ja', 'Japanese'), ('pl', 'Polish'),
    ('pt', 'Portuguese'), ('es', 'Spanish'), ('tr', 'Turkish'),
]

T = {}

T['de'] = dict(
    untertitel='Reaktion, Takt und Kombis',
    promo='Sechs Pratzen, fünf Modi, fünfzig Level: Boxolo misst deine Reaktion in Millisekunden. Ohne Werbung, ohne Konto, ohne Käufe.',
    keywords='reaktion,reflexe,boxen,rhythmus,takt,tippen,kinder,training,geschick,konzentration,schnell',
    beschreibung='''Boxolo ist ein Reaktionsspiel für Kinder. Sechs Trefferzonen liegen auf dem Bildschirm wie die Pratzen im Boxtraining. Sie leuchten auf oder werden von einem Ring angekündigt, und du triffst sie mit den Fingern – so schnell und so genau wie möglich.

Es wird nicht gekämpft. Es gibt keinen Gegner, keine Treffer am Körper und keine Niederlage. Nur dich, den Takt und deine eigene Bestzeit.

FÜNF MODI
• Reaktion: Eine Zone leuchtet zu einem zufälligen Zeitpunkt auf. Gemessen wird die Zeit bis zur Berührung, in Millisekunden.
• Timing: Ein Ring zieht sich zusammen. Triff den Moment, in dem er den Zonenrand berührt.
• Kombination: Eine Schlagfolge wird vorgeführt, dann schlägst du sie in derselben Reihenfolge nach.
• Ausdauer: 60 Sekunden Dauerfeuer, alle 10 Sekunden schneller.
• Rhythmus: Die Schlagfolgen liegen auf den Zählzeiten der Musik. Erst zuhören, dann nachspielen.

ECHTE BOXNOTATION
Die sechs Zonen tragen die Nummern aus dem Boxtraining: 1 Jab links, 2 Cross rechts, 3 und 4 die Haken, 5 und 6 die Uppercuts. Klassische Folgen wie 1-2, 1-2-3 oder 1-2-5-2 lernst du hier über den Takt.

ZEHN LEVEL JE MODUS
Von Level 1 bis 10 steigen Tempo, Zahl der Zonen und Länge der Folgen. Das Trefferfenster wird enger, und später tauchen Störziele auf, die nicht getroffen werden dürfen. Alle Level und alle Modi sind von Anfang an frei wählbar. Nichts muss freigespielt werden.

BEWERTUNG
Jeder Schlag bekommt ein Urteil: Perfekt, Gut, Ok oder Daneben. Zehn Treffer in Folge heben den Serienmultiplikator. Punkte werden nur gezählt – es wird nichts abgezogen, nichts ausgegeben und nichts gekauft.

DEIN FORTSCHRITT
Bestenlisten für jeden Modus und jedes Level. Eine Kurve zeigt, wie sich deine Reaktionszeit über die letzten 30 Tage entwickelt.

GENAUE MESSUNG
Zwischen Ton, Bild und Berührung vergeht auf jedem Gerät etwas Zeit. In der Kalibrierung tippst du acht Schläge mit, und Boxolo rechnet diese Verzögerung aus jeder Messung heraus.

FÜR ELTERN
Keine Werbung. Kein Konto. Keine Käufe im Spiel. Keine Verbindung ins Internet. Alle Ergebnisse bleiben auf dem Gerät.

Boxolo gibt es in zwölf Sprachen.''')

T['en'] = dict(
    untertitel='Reaction, beat and combos',
    promo='Six pads, five modes, fifty levels: Boxolo measures your reaction in milliseconds. No ads, no account, nothing to buy.',
    keywords='reaction,reflex,boxing,rhythm,beat,tapping,kids,training,coordination,focus,speed',
    beschreibung='''Boxolo is a reaction game for kids. Six target zones sit on the screen like the pads in boxing training. They light up or are announced by a closing ring, and you hit them with your fingers – as fast and as accurately as you can.

There is no fighting. No opponent, no blows to a body, no defeat. Just you, the beat and your own best time.

FIVE MODES
• Reaction: A zone lights up at an unpredictable moment. The time until your touch is measured, in milliseconds.
• Timing: A ring closes in. Hit the moment it meets the edge of the zone.
• Combination: A punch sequence is shown first, then you repeat it in the same order.
• Stamina: 60 seconds non-stop, faster every 10 seconds.
• Rhythm: The sequences sit on the beats of the music. Listen first, then play along.

REAL BOXING NOTATION
The six zones carry the numbers used in boxing training: 1 jab left, 2 cross right, 3 and 4 the hooks, 5 and 6 the uppercuts. Classic sequences such as 1-2, 1-2-3 or 1-2-5-2 are learned here through the beat.

TEN LEVELS PER MODE
From level 1 to 10 the tempo, the number of zones and the length of the sequences all rise. The hit window gets tighter, and later on decoys appear that must not be hit. Every level and every mode can be chosen freely from the start. Nothing has to be unlocked.

SCORING
Every punch gets a verdict: Perfect, Good, Ok or Missed. Ten hits in a row raise the streak multiplier. Points are only counted – nothing is taken away, nothing is spent and nothing is bought.

YOUR PROGRESS
High scores for every mode and every level. A curve shows how your reaction time has developed over the last 30 days.

ACCURATE MEASUREMENT
On every device a little time passes between sound, picture and touch. During calibration you tap along with eight beats, and Boxolo subtracts that delay from every measurement.

FOR PARENTS
No ads. No account. No in-app purchases. No internet connection. All results stay on the device.

Boxolo is available in twelve languages.''')

T['fr'] = dict(
    untertitel='Réflexes, rythme et combos',
    promo='Six pattes d’ours, cinq modes, cinquante niveaux : Boxolo mesure tes réflexes en millisecondes. Sans publicité, sans compte, sans achat.',
    keywords='reflexes,reaction,boxe,rythme,tempo,toucher,enfants,entrainement,adresse,vitesse,jeu',
    beschreibung='''Boxolo est un jeu de réflexes pour les enfants. Six zones cibles occupent l’écran comme les pattes d’ours à l’entraînement de boxe. Elles s’allument ou sont annoncées par un anneau qui se resserre, et tu les touches avec les doigts – le plus vite et le plus précisément possible.

On ne se bat pas. Pas d’adversaire, pas de coups portés à quelqu’un, pas de défaite. Juste toi, le rythme et ton propre record.

CINQ MODES
• Réflexes : une zone s’allume à un moment imprévisible. On mesure le temps jusqu’au contact, en millisecondes.
• Timing : un anneau se resserre. Frappe au moment où il atteint le bord de la zone.
• Enchaînement : une suite de coups est montrée, puis tu la refais dans le même ordre.
• Endurance : 60 secondes sans pause, plus rapide toutes les 10 secondes.
• Rythme : les suites tombent sur les temps de la musique. Écoute d’abord, puis répète.

LA VRAIE NOTATION DE LA BOXE
Les six zones portent les numéros de l’entraînement de boxe : 1 jab gauche, 2 direct droit, 3 et 4 les crochets, 5 et 6 les uppercuts. Des suites classiques comme 1-2, 1-2-3 ou 1-2-5-2 s’apprennent ici par le rythme.

DIX NIVEAUX PAR MODE
Du niveau 1 au niveau 10, le tempo, le nombre de zones et la longueur des suites augmentent. La fenêtre de réussite se resserre, et plus tard des leurres apparaissent : il ne faut pas les toucher. Tous les niveaux et tous les modes sont accessibles dès le départ. Rien n’est à débloquer.

NOTATION
Chaque coup reçoit une note : Parfait, Bien, Correct ou Raté. Dix touches d’affilée font monter le multiplicateur de série. Les points sont seulement comptés – rien n’est retiré, rien n’est dépensé et rien n’est acheté.

TA PROGRESSION
Des meilleurs scores pour chaque mode et chaque niveau. Une courbe montre l’évolution de ton temps de réaction sur les 30 derniers jours.

UNE MESURE JUSTE
Sur chaque appareil, un peu de temps s’écoule entre le son, l’image et le contact. Pendant le calibrage, tu accompagnes huit temps, et Boxolo retranche ce décalage de chaque mesure.

POUR LES PARENTS
Pas de publicité. Pas de compte. Pas d’achat intégré. Aucune connexion à Internet. Tous les résultats restent sur l’appareil.

Boxolo existe en douze langues.''')

T['es'] = dict(
    untertitel='Reflejos, ritmo y combos',
    promo='Seis manoplas, cinco modos, cincuenta niveles: Boxolo mide tus reflejos en milisegundos. Sin anuncios, sin cuenta, sin compras.',
    keywords='reflejos,reaccion,boxeo,ritmo,compas,tocar,ninos,entrenamiento,destreza,rapidez,juego',
    beschreibung='''Boxolo es un juego de reflejos para niños. Seis zonas de impacto ocupan la pantalla como las manoplas del entrenamiento de boxeo. Se encienden o las anuncia un anillo que se cierra, y tú las tocas con los dedos, lo más rápido y lo más exacto que puedas.

Aquí no se pelea. No hay rival, no hay golpes a nadie y no hay derrota. Solo tú, el compás y tu propia marca.

CINCO MODOS
• Reflejos: una zona se enciende en un momento imprevisible. Se mide el tiempo hasta el contacto, en milisegundos.
• Precisión: un anillo se cierra. Golpea en el momento en que llega al borde de la zona.
• Combinación: primero se muestra una serie de golpes y después la repites en el mismo orden.
• Resistencia: 60 segundos sin parar, más rápido cada 10 segundos.
• Ritmo: las series caen sobre los tiempos de la música. Primero escucha, luego repite.

LA NOTACIÓN REAL DEL BOXEO
Las seis zonas llevan los números del entrenamiento de boxeo: 1 jab izquierdo, 2 directo derecho, 3 y 4 los ganchos, 5 y 6 los crochets. Series clásicas como 1-2, 1-2-3 o 1-2-5-2 se aprenden aquí a través del compás.

DIEZ NIVELES POR MODO
Del nivel 1 al 10 suben el tempo, el número de zonas y la longitud de las series. La ventana de acierto se estrecha y más adelante aparecen señuelos que no se deben golpear. Todos los niveles y todos los modos se pueden elegir desde el principio. No hay nada que desbloquear.

PUNTUACIÓN
Cada golpe recibe una valoración: Perfecto, Bien, Correcto o Fallo. Diez aciertos seguidos suben el multiplicador de racha. Los puntos solo se cuentan: no se resta nada, no se gasta nada y no se compra nada.

TU EVOLUCIÓN
Mejores marcas para cada modo y cada nivel. Una curva muestra cómo evoluciona tu tiempo de reacción en los últimos 30 días.

UNA MEDICIÓN EXACTA
En cada aparato pasa algo de tiempo entre el sonido, la imagen y el contacto. En la calibración acompañas ocho golpes y Boxolo descuenta ese retraso de cada medición.

PARA LAS FAMILIAS
Sin anuncios. Sin cuenta. Sin compras dentro del juego. Sin conexión a internet. Todos los resultados se quedan en el aparato.

Boxolo está disponible en doce idiomas.''')

T['it'] = dict(
    untertitel='Riflessi, ritmo e combo',
    promo='Sei colpitori, cinque modalità, cinquanta livelli: Boxolo misura i tuoi riflessi in millisecondi. Senza pubblicità, senza account, senza acquisti.',
    keywords='riflessi,reazione,pugilato,ritmo,tempo,toccare,bambini,allenamento,abilita,velocita,gioco',
    beschreibung='''Boxolo è un gioco di riflessi per bambini. Sei zone bersaglio stanno sullo schermo come i colpitori nell’allenamento di pugilato. Si accendono oppure le annuncia un anello che si stringe, e tu le colpisci con le dita, il più in fretta e il più precisamente possibile.

Qui non si combatte. Niente avversario, niente colpi a qualcuno, nessuna sconfitta. Solo tu, il tempo e il tuo record.

CINQUE MODALITÀ
• Riflessi: una zona si accende in un momento imprevedibile. Si misura il tempo fino al tocco, in millisecondi.
• Tempo: un anello si stringe. Colpisci nell’istante in cui raggiunge il bordo della zona.
• Combinazione: prima viene mostrata una serie di colpi, poi la ripeti nello stesso ordine.
• Resistenza: 60 secondi senza pause, più veloce ogni 10 secondi.
• Ritmo: le serie cadono sui tempi della musica. Prima ascolta, poi ripeti.

LA VERA NOTAZIONE DEL PUGILATO
Le sei zone portano i numeri dell’allenamento di pugilato: 1 jab sinistro, 2 diretto destro, 3 e 4 i ganci, 5 e 6 i montanti. Serie classiche come 1-2, 1-2-3 o 1-2-5-2 si imparano qui attraverso il tempo.

DIECI LIVELLI PER MODALITÀ
Dal livello 1 al 10 crescono la velocità, il numero di zone e la lunghezza delle serie. La finestra si restringe e più avanti compaiono esche da non colpire. Tutti i livelli e tutte le modalità sono liberamente selezionabili fin dall’inizio. Non c’è niente da sbloccare.

VALUTAZIONE
Ogni colpo riceve un giudizio: Perfetto, Bene, Discreto o Sbagliato. Dieci colpi a segno di fila alzano il moltiplicatore di serie. I punti vengono solo contati: non si toglie nulla, non si spende nulla e non si compra nulla.

I TUOI PROGRESSI
Record per ogni modalità e ogni livello. Una curva mostra come si evolve il tuo tempo di reazione negli ultimi 30 giorni.

UNA MISURA PRECISA
Su ogni dispositivo passa un po’ di tempo tra suono, immagine e tocco. Nella taratura accompagni otto battiti e Boxolo sottrae quel ritardo da ogni misurazione.

PER I GENITORI
Nessuna pubblicità. Nessun account. Nessun acquisto in-app. Nessuna connessione a internet. Tutti i risultati restano sul dispositivo.

Boxolo è disponibile in dodici lingue.''')

T['pt'] = dict(
    untertitel='Reflexos, ritmo e combos',
    promo='Seis manoplas, cinco modos, cinquenta níveis: o Boxolo mede os teus reflexos em milissegundos. Sem anúncios, sem conta, sem compras.',
    keywords='reflexos,reacao,boxe,ritmo,compasso,tocar,criancas,treino,destreza,rapidez,jogo',
    beschreibung='''O Boxolo é um jogo de reflexos para crianças. Seis zonas de alvo ocupam o ecrã como as manoplas do treino de boxe. Acendem ou são anunciadas por um anel que se fecha, e tu acertas-lhes com os dedos, o mais depressa e com a maior precisão possível.

Aqui não se luta. Não há adversário, não há golpes em ninguém e não há derrota. Só tu, o compasso e a tua própria marca.

CINCO MODOS
• Reflexos: uma zona acende num momento imprevisível. Mede-se o tempo até ao toque, em milissegundos.
• Ritmo certo: um anel fecha-se. Acerta no momento em que chega à margem da zona.
• Combinação: primeiro mostra-se uma série de golpes e depois repete-la pela mesma ordem.
• Resistência: 60 segundos sem parar, mais rápido a cada 10 segundos.
• Compasso: as séries caem nos tempos da música. Primeiro ouve, depois repete.

A NOTAÇÃO REAL DO BOXE
As seis zonas têm os números do treino de boxe: 1 jab esquerdo, 2 directo direito, 3 e 4 os ganchos, 5 e 6 os cruzados. Séries clássicas como 1-2, 1-2-3 ou 1-2-5-2 aprendem-se aqui pelo compasso.

DEZ NÍVEIS POR MODO
Do nível 1 ao 10 sobem o andamento, o número de zonas e o comprimento das séries. A janela de acerto aperta e mais à frente surgem chamarizes que não podem ser acertados. Todos os níveis e todos os modos podem ser escolhidos desde o início. Não há nada para desbloquear.

PONTUAÇÃO
Cada golpe recebe uma apreciação: Perfeito, Bom, Razoável ou Falhado. Dez acertos seguidos sobem o multiplicador de série. Os pontos são apenas contados: nada é retirado, nada é gasto e nada é comprado.

A TUA EVOLUÇÃO
Melhores marcas para cada modo e cada nível. Uma curva mostra como evolui o teu tempo de reacção nos últimos 30 dias.

UMA MEDIÇÃO EXACTA
Em cada aparelho passa algum tempo entre o som, a imagem e o toque. Na calibração acompanhas oito batidas e o Boxolo desconta esse atraso de cada medição.

PARA OS PAIS
Sem anúncios. Sem conta. Sem compras dentro do jogo. Sem ligação à internet. Todos os resultados ficam no aparelho.

O Boxolo está disponível em doze idiomas.''')

T['nl'] = dict(
    untertitel='Reactie, ritme en combo’s',
    promo='Zes stootkussens, vijf modi, vijftig levels: Boxolo meet je reactie in milliseconden. Geen reclame, geen account, niets te kopen.',
    keywords='reactie,reflex,boksen,ritme,maat,tikken,kinderen,training,behendigheid,snelheid,spel',
    beschreibung='''Boxolo is een reactiespel voor kinderen. Zes doelzones staan op het scherm zoals de stootkussens bij bokstraining. Ze lichten op of worden aangekondigd door een ring die samentrekt, en jij raakt ze met je vingers – zo snel en zo nauwkeurig mogelijk.

Er wordt niet gevochten. Geen tegenstander, geen klappen op iemand, geen nederlaag. Alleen jij, de maat en je eigen besttijd.

VIJF MODI
• Reactie: een zone licht op een onvoorspelbaar moment op. De tijd tot je aanraking wordt gemeten, in milliseconden.
• Timing: een ring trekt samen. Raak het moment waarop hij de rand van de zone bereikt.
• Combinatie: een reeks stoten wordt eerst voorgedaan, daarna herhaal je die in dezelfde volgorde.
• Uithouding: 60 seconden non-stop, elke 10 seconden sneller.
• Ritme: de reeksen liggen op de tellen van de muziek. Eerst luisteren, dan naspelen.

ECHTE BOKSNOTATIE
De zes zones dragen de nummers uit de bokstraining: 1 jab links, 2 rechte rechts, 3 en 4 de hoeken, 5 en 6 de opstoten. Klassieke reeksen als 1-2, 1-2-3 of 1-2-5-2 leer je hier via de maat.

TIEN LEVELS PER MODUS
Van level 1 tot 10 stijgen het tempo, het aantal zones en de lengte van de reeksen. Het venster wordt smaller en later verschijnen lokdoelen die je niet mag raken. Alle levels en alle modi zijn vanaf het begin vrij te kiezen. Er hoeft niets vrijgespeeld te worden.

BEOORDELING
Elke stoot krijgt een oordeel: Perfect, Goed, Oké of Mis. Tien rake klappen op rij verhogen de reeksvermenigvuldiger. Punten worden alleen geteld – er gaat niets af, er wordt niets uitgegeven en niets gekocht.

JOUW VOORTGANG
Topscores voor elke modus en elk level. Een curve laat zien hoe je reactietijd zich over de laatste 30 dagen ontwikkelt.

NAUWKEURIG METEN
Op elk toestel zit wat tijd tussen geluid, beeld en aanraking. Bij de kalibratie tik je acht tikken mee en Boxolo rekent die vertraging uit elke meting weg.

VOOR OUDERS
Geen reclame. Geen account. Geen aankopen in het spel. Geen internetverbinding. Alle resultaten blijven op het toestel.

Boxolo is er in twaalf talen.''')

T['pl'] = dict(
    untertitel='Refleks, rytm i kombinacje',
    promo='Sześć tarcz, pięć trybów, pięćdziesiąt poziomów: Boxolo mierzy twój refleks w milisekundach. Bez reklam, bez konta, bez zakupów.',
    keywords='refleks,reakcja,boks,rytm,takt,stukanie,dzieci,trening,zrecznosc,szybkosc,gra',
    beschreibung='''Boxolo to gra na refleks dla dzieci. Sześć stref leży na ekranie jak tarcze na treningu bokserskim. Zapalają się albo zapowiada je zwężający się pierścień, a ty trafiasz w nie palcami – jak najszybciej i jak najdokładniej.

Tu się nie walczy. Nie ma przeciwnika, nie ma ciosów w kogoś i nie ma przegranej. Jest tylko ty, takt i twój własny rekord.

PIĘĆ TRYBÓW
• Refleks: strefa zapala się w nieprzewidywalnym momencie. Mierzony jest czas do dotknięcia, w milisekundach.
• Rytm: pierścień się zwęża. Uderz w chwili, gdy dojdzie do krawędzi strefy.
• Kombinacja: najpierw pokazywana jest seria ciosów, potem powtarzasz ją w tej samej kolejności.
• Wytrzymałość: 60 sekund bez przerwy, co 10 sekund szybciej.
• Takt: serie leżą na miarach muzyki. Najpierw słuchaj, potem powtarzaj.

PRAWDZIWA NOTACJA BOKSERSKA
Sześć stref nosi numery z treningu bokserskiego: 1 lewy prosty, 2 prawy prosty, 3 i 4 sierpowe, 5 i 6 podbródkowe. Klasyczne serie jak 1-2, 1-2-3 czy 1-2-5-2 poznajesz tu przez takt.

DZIESIĘĆ POZIOMÓW NA TRYB
Od poziomu 1 do 10 rosną tempo, liczba stref i długość serii. Okno trafienia się zwęża, a później pojawiają się cele mylące, w które nie wolno trafiać. Wszystkie poziomy i wszystkie tryby są dostępne od samego początku. Niczego nie trzeba odblokowywać.

OCENA
Każdy cios dostaje ocenę: Idealnie, Dobrze, Nieźle albo Pudło. Dziesięć trafień z rzędu podnosi mnożnik serii. Punkty są tylko liczone – nic nie jest odejmowane, nic nie jest wydawane i nic nie jest kupowane.

TWOJE POSTĘPY
Listy najlepszych wyników dla każdego trybu i każdego poziomu. Krzywa pokazuje, jak zmienia się twój czas reakcji przez ostatnie 30 dni.

DOKŁADNY POMIAR
Na każdym urządzeniu mija trochę czasu między dźwiękiem, obrazem i dotknięciem. Przy kalibracji dotykasz razem z ośmioma uderzeniami, a Boxolo odejmuje to opóźnienie od każdego pomiaru.

DLA RODZICÓW
Bez reklam. Bez konta. Bez zakupów w grze. Bez połączenia z internetem. Wszystkie wyniki zostają na urządzeniu.

Boxolo jest dostępne w dwunastu językach.''')

T['tr'] = dict(
    untertitel='Tepki, ritim ve kombinasyon',
    promo='Altı ped, beş mod, elli seviye: Boxolo tepki süreni milisaniye cinsinden ölçer. Reklam yok, hesap yok, satın alma yok.',
    keywords='tepki,refleks,boks,ritim,tempo,dokunma,cocuk,antrenman,beceri,hiz,oyun,dikkat',
    beschreibung='''Boxolo çocuklar için bir tepki oyunu. Ekranda, boks antrenmanındaki pedler gibi altı hedef bölgesi var. Bölgeler yanar ya da daralan bir halka onları önceden haber verir, sen de parmaklarınla olabildiğince hızlı ve olabildiğince isabetli vurursun.

Burada dövüşülmez. Rakip yok, kimseye vuruş yok, yenilgi yok. Yalnızca sen, tempo ve kendi en iyi derecen.

BEŞ MOD
• Tepki: bir bölge önceden kestirilemeyen bir anda yanar. Dokunuşa kadar geçen süre milisaniye cinsinden ölçülür.
• Zamanlama: bir halka daralır. Bölgenin kenarına ulaştığı anda vur.
• Kombinasyon: önce bir vuruş dizisi gösterilir, sonra aynı sırayla tekrarlarsın.
• Dayanıklılık: 60 saniye ara vermeden, her 10 saniyede bir daha hızlı.
• Ritim: diziler müziğin vuruşlarına denk gelir. Önce dinle, sonra tekrarla.

GERÇEK BOKS YAZIMI
Altı bölge boks antrenmanındaki numaraları taşır: 1 sol direkt, 2 sağ direkt, 3 ve 4 kroşeler, 5 ve 6 aparkatlar. 1-2, 1-2-3 ya da 1-2-5-2 gibi klasik diziler burada tempo üzerinden öğrenilir.

HER MODDA ON SEVİYE
1. seviyeden 10. seviyeye tempo, bölge sayısı ve dizilerin uzunluğu artar. İsabet penceresi daralır, ilerleyen seviyelerde de vurulmaması gereken yanıltıcı hedefler belirir. Bütün seviyeler ve bütün modlar en baştan serbestçe seçilebilir. Açılması gereken hiçbir şey yok.

DEĞERLENDİRME
Her vuruş bir not alır: Kusursuz, İyi, Olur ya da Iskaladın. Art arda on isabet seri çarpanını yükseltir. Puanlar yalnızca sayılır; hiçbir şey düşülmez, harcanmaz ve satın alınmaz.

GELİŞİMİN
Her mod ve her seviye için en iyiler listesi. Bir eğri, tepki sürenin son 30 günde nasıl geliştiğini gösterir.

DOĞRU ÖLÇÜM
Her cihazda ses, görüntü ve dokunuş arasında biraz zaman geçer. Ayarlamada sekiz vuruşa eşlik edersin ve Boxolo bu gecikmeyi her ölçümden çıkarır.

AİLELER İÇİN
Reklam yok. Hesap yok. Oyun içi satın alma yok. İnternet bağlantısı yok. Bütün sonuçlar cihazda kalır.

Boxolo on iki dilde mevcut.''')

T['ja'] = dict(
    untertitel='反応・タイミング・コンビネーション',
    promo='6つのミット、5つのモード、50のレベル。Boxoloは反応時間をミリ秒で測ります。広告なし、アカウントなし、課金なし。',
    keywords='反応,反射,ボクシング,リズム,タイミング,タップ,子ども,トレーニング,集中力,記録',
    beschreibung='''Boxoloは子ども向けの反応ゲームです。画面にはボクシング練習のミットのような6つのターゲットゾーンがあります。ゾーンが光るか、縮まるリングが合図します。そこを指で、できるだけ速く、できるだけ正確にタッチしてください。

戦う内容はありません。対戦相手も、人を打つ描写も、敗北もありません。あるのは自分と拍と自己ベストだけです。

5つのモード
・反応：ゾーンが予測できないタイミングで光ります。触れるまでの時間をミリ秒で計測します。
・タイミング：リングが縮みます。ゾーンのふちに重なった瞬間をねらってください。
・コンビネーション：パンチの並びが先に示され、同じ順番でくり返します。
・スタミナ：60秒ノンストップ、10秒ごとに速くなります。
・リズム：並びが音楽の拍の上にのります。まず聴いて、それから返します。

本物のボクシング表記
6つのゾーンにはボクシング練習の番号がついています。1は左ジャブ、2は右ストレート、3と4はフック、5と6はアッパー。1-2、1-2-3、1-2-5-2といった定番の並びを、拍から覚えられます。

各モード10レベル
レベル1から10へ進むと、速さ、光るゾーンの数、並びの長さが増えます。判定の幅はせまくなり、後半にはたたいてはいけないおとりが現れます。レベルもモードも最初からすべて自由に選べます。解放の条件はありません。

判定
一発ごとにパーフェクト、グッド、オーケー、ミスのいずれかがつきます。10回連続で命中すると連続倍率が上がります。点数は数えるだけで、減ることも、使うことも、買うこともありません。

記録の推移
モードごと、レベルごとのベスト記録。直近30日の反応時間の変化を曲線で確認できます。

正確な計測
どの端末でも、音と画面とタッチのあいだにわずかな時間差があります。調整で8回の拍に合わせてタッチすると、Boxoloがその遅れをすべての計測から差し引きます。

保護者の方へ
広告はありません。アカウントもありません。アプリ内課金もありません。インターネットにも接続しません。すべての記録は端末の中だけに残ります。

Boxoloは12の言語に対応しています。''')

T['zh'] = dict(
    untertitel='反应、节拍与组合',
    promo='六块拳靶、五种模式、五十个关卡。Boxolo以毫秒测量你的反应。没有广告，没有账号，没有任何内购。',
    keywords='反应,反射,拳击,节奏,节拍,点击,儿童,训练,专注,手速,记录,游戏',
    beschreibung='''Boxolo是一款给孩子玩的反应游戏。屏幕上有六个目标区域，就像拳击训练里的拳靶。它们会亮起，或者由一个收拢的圆环提前预告，你用手指去打中它们，越快越准越好。

这里没有打斗。没有对手，没有打在人身上的画面，也没有失败。只有你、拍子和自己的最好成绩。

五种模式
· 反应：某个区域在无法预料的时刻亮起。游戏测量从亮起到触碰的时间，单位是毫秒。
· 节拍：一个圆环向内收拢。要在它贴到区域边缘的那一刻出拳。
· 组合：先演示一串拳，然后你按同样的顺序打一遍。
· 耐力：60秒不停歇，每10秒加快一次。
· 律动：拳串落在音乐的拍点上。先听，再跟着打。

真实的拳击记法
六个区域沿用拳击训练的编号：1是左刺拳，2是右直拳，3和4是摆拳，5和6是上勾拳。1-2、1-2-3、1-2-5-2这样的经典拳串，在这里通过拍子来记住。

每种模式十个关卡
从第1关到第10关，速度、亮起的区域数和拳串长度都在增加。判定窗口变窄，后面还会出现不能打的干扰目标。所有关卡和模式从一开始就能自由选择，不需要解锁任何内容。

评分
每一拳都会得到评定：完美、不错、还行或失手。连续命中十次会提高连击倍数。分数只会累加，不会扣减，不会花掉，也买不到任何东西。

你的进步
每种模式、每个关卡都有各自的最佳成绩。一条曲线显示最近30天里你的反应时间如何变化。

准确的测量
在任何设备上，声音、画面和触碰之间都会差一点时间。校准时你跟着八下拍子点击，Boxolo会把这段延迟从每次测量中减去。

给家长
没有广告。没有账号。没有应用内购买。不连接互联网。所有成绩只留在这台设备上。

Boxolo提供十二种语言。''')

T['ar'] = dict(
    untertitel='رد الفعل والإيقاع والتسلسلات',
    promo='ست وسادات وخمسة أنماط وخمسون مستوى: يقيس Boxolo رد فعلك بالمللي ثانية. بلا إعلانات ولا حساب ولا عمليات شراء.',
    keywords='رد الفعل,سرعة,ملاكمة,إيقاع,توقيت,لمس,أطفال,تدريب,مهارة,تركيز,لعبة',
    beschreibung='''‏Boxolo لعبة رد فعل للأطفال. على الشاشة ست مناطق إصابة تشبه وسادات تدريب الملاكمة. تضيء المناطق أو تعلن عنها حلقة تضيق حولها، وأنت تلمسها بأصابعك بأسرع وأدق ما يمكن.

لا قتال هنا. لا خصم ولا ضربات على أحد ولا هزيمة. أنت فقط والإيقاع ورقمك الشخصي.

خمسة أنماط
• رد الفعل: تضيء منطقة في لحظة غير متوقعة. يُقاس الزمن حتى اللمس بالمللي ثانية.
• التوقيت: تضيق حلقة. الكم في اللحظة التي تبلغ فيها حافة المنطقة.
• التسلسل: يُعرض أولًا تسلسل لكمات، ثم تعيده بالترتيب نفسه.
• التحمل: ستون ثانية بلا توقف، وأسرع كل عشر ثوان.
• الإيقاع: تقع التسلسلات على نبضات الموسيقى. استمع أولًا ثم أعد.

ترقيم الملاكمة الحقيقي
تحمل المناطق الست أرقام تدريب الملاكمة: ١ لكمة يسرى مستقيمة، ٢ لكمة يمنى مستقيمة، ٣ و٤ الخطافان، ٥ و٦ اللكمتان الصاعدتان. تسلسلات معروفة مثل 1-2 و1-2-3 و1-2-5-2 تتعلمها هنا عبر الإيقاع.

عشرة مستويات لكل نمط
من المستوى ١ إلى ١٠ ترتفع السرعة وعدد المناطق وطول التسلسلات. وتضيق نافذة الإصابة، ثم تظهر لاحقًا أهداف خادعة يجب عدم إصابتها. كل المستويات وكل الأنماط متاحة للاختيار الحر منذ البداية، ولا شيء يحتاج إلى فتح.

التقييم
تنال كل لكمة تقديرًا: ممتاز أو جيد أو مقبول أو أخطأت. عشر إصابات متتالية ترفع مضاعف السلسلة. النقاط تُحتسب فقط، فلا يُخصم شيء ولا يُنفق شيء ولا يُشترى شيء.

تقدمك
قوائم أفضل النتائج لكل نمط ولكل مستوى. ويعرض منحنى كيف يتطور زمن رد فعلك خلال آخر ثلاثين يومًا.

قياس دقيق
على كل جهاز يمر بعض الوقت بين الصوت والصورة واللمس. في المعايرة تلمس مع ثماني نبضات، ويطرح Boxolo هذا التأخير من كل قياس.

للأهل
لا إعلانات. لا حساب. لا عمليات شراء داخل اللعبة. لا اتصال بالإنترنت. كل النتائج تبقى على الجهاز.

‏Boxolo متوفر باثنتي عشرة لغة.''')


def main():
    if os.path.isdir(ZIEL):
        shutil.rmtree(ZIEL)
    os.makedirs(ZIEL)
    fehler = []
    for nr, (code, ordner) in enumerate(SPRACHEN, start=1):
        d = T[code]
        for feld, grenze in GRENZEN.items():
            n = len(d[feld])
            if n > grenze:
                fehler.append('%s %s: %d von höchstens %d Zeichen' % (code, feld, n, grenze))
        if ' ,' in d['keywords'] or ', ' in d['keywords']:
            fehler.append('%s keywords: Leerzeichen am Komma' % code)
        inhalt = (
            '# Boxolo – App Store Connect – %s\n\n'
            '## Promotional Text (max. 170 characters, currently %d)\n\n%s\n\n'
            '## Description (max. 4000 characters, currently %d)\n\n%s\n\n'
            '## Keywords (max. 100 characters, currently %d)\n\n%s\n\n'
            '## Subtitle (max. 30 characters, currently %d)\n\n%s\n'
        ) % (ordner, len(d['promo']), d['promo'], len(d['beschreibung']), d['beschreibung'],
             len(d['keywords']), d['keywords'], len(d['untertitel']), d['untertitel'])
        with open(os.path.join(ZIEL, '%02d_%s.md' % (nr, ordner)), 'w', encoding='utf-8') as f:
            f.write(inhalt)
    if fehler:
        raise SystemExit('GRENZEN VERLETZT:\n' + '\n'.join(fehler))
    print('Textdateien:', len(SPRACHEN), '- alle Grenzen eingehalten')


if __name__ == '__main__':
    main()
