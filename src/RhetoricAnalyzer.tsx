import { useState } from 'react';
import { AlertTriangle, Search, CheckCircle, BarChart2, ShieldAlert, Quote, Brain, Info } from 'lucide-react';

interface Tactic {
  name: string;
  severity: string;
  quote: string;
  explanation: string;
}

interface AnalysisResult {
  populism_score: number;
  summary: string;
  tone_analysis: string;
  tactics: Tactic[];
}

const RhetoricAnalyzer = () => {
  const [apiKey, setApiKey] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // The System Prompt Definition
  const SYSTEM_PROMPT = `
  תפקידך הוא לשמש כחוקר רטוריקה פוליטית ופסיכולוגיה חברתית. עליך לנתח את הטקסט הבא (פוסט ותגובות) ולזהות דפוסים של רטוריקה פופוליסטית, מניפולטיבית או כזו המזוהה עם סגנון ה-"Alt-Right" / "MAGA", וכן טכניקות תעמולה כלליות.

  השתמש בטבלה הבאה כקריטריונים לניתוח:

  1. **Projection (השלכה):** האשמת היריב בדיוק בכשלים או בהתנהגות שהדובר או המחנה שלו לוקים בהם (למשל: תוקף דמוקרטיה שמאשים אחרים בפאשיזם).
  2. **Whataboutism (אד תו קווקה):** הסטת הדיון מביקורת לגיטימית על צד א' ע"י הצבעה על עוולה (אמיתית או מומצאת) של צד ב'.
  3. **Tribalism / Us vs. Them (שבטיות):** חלוקה בינארית ל"טובים" ו"רעים". דה-הומניזציה של היריב (כינויים כמו "בוגדים", "אויבים", "מחלה").
  4. **Gaslighting (עמעום הדעת):** הכחשת מציאות עובדתית ברורה, או הצגת נרטיב הפוך בביטחון מלא כדי לערער את תפיסת המציאות של המאזין.
  5. **Name Calling (הדבקת תוויות):** שימוש בכינויי גנאי מקטינים (למשל "ליבטרדס", "ביביסטים", "שרל-ביסטים") כדי לבטל את הלגיטימיות של הדובר.
  6. **Strawman (איש הקש):** עיוות עמדת היריב לגרסה קיצונית ומגוחכת כדי לתקוף אותה בקלות.
  7. **Victimhood (התקרבנות אגרסיבית):** הצגת הצד החזק/התוקף כקורבן הנרדף על ידי "המערכת" או "האליטות".
  8. **Intellectualizing Bias (אינטלקטואליזציה של הטיה):** שימוש בשפה פסבדו-אקדמית או מונחים פסיכולוגיים ("דיסוננס קוגניטיבי", "הטיות קוגניטיביות") כדי לתת מסווה מדעי לדעה פוליטית סובייקטיבית.

  עבור כל טקסט שיתקבל, החזר פלט בפורמט JSON בלבד (ללא Markdown מסביב) במבנה הבא. הקפד על JSON תקין לחלוטין (Valid JSON):
  {
    "populism_score": (מספר בין 0 ל-100, כאשר 100 הוא טקסט מניפולטיבי/פופוליסטי לחלוטין),
    "summary": "סיכום קצר של הניתוח בעברית (עד 2 משפטים)",
    "tone_analysis": "ניתוח הטון (למשל: מתנשא, אגרסיבי, פסבדו-אינטלקטואלי)",
    "tactics": [
      {
        "name": "שם הטקטיקה מהרשימה למעלה",
        "severity": "High/Medium/Low",
        "quote": "ציטוט מדויק מהטקסט שמדגים את הטקטיקה (הקפד לא לשבור את ה-JSON עם מרכאות כפולות בתוך הציטוט)",
        "explanation": "הסבר קצר מדוע זה מתאים לטקטיקה זו"
      }
    ]
  }
  `;

  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError("אנא הכנס טקסט לניתוח");
      return;
    }
    if (!apiKey.trim()) {
      setError("אנא הכנס מפתח API של Gemini");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${SYSTEM_PROMPT}\n\nהנה הטקסט לניתוח:\n${inputText}`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text;

      // CLEANING LOGIC: Remove Markdown and find the JSON object
      // This fixes the SyntaxError by extracting { ... } and ignoring surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawText = jsonMatch[0];
      }

      const parsedResult = JSON.parse(rawText);
      setResult(parsedResult);

    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError("אירעה שגיאה בניתוח או בפענוח התשובה. נסה שוב. " + err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBarColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 60) return "bg-yellow-500";
    return "bg-red-600";
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-r-4 border-blue-600 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              מנתח רטוריקה פוליטית
            </h1>
            <p className="text-slate-500 mt-1">
              זיהוי אוטומטי של כשלים לוגיים, דמוגוגיה ושיטות "MAGA" בטקסטים.
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showPrompt ? 'הסתר את הפרומפט' : 'הצג את הפרומפט המלא'}
          </button>
        </div>

        {/* System Prompt View (Collapsible) */}
        {showPrompt && (
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-sm font-mono overflow-auto max-h-60 shadow-inner whitespace-pre-wrap">
            {SYSTEM_PROMPT}
          </div>
        )}

        {/* API Key Input */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            placeholder="הדבק כאן את המפתח (AIza...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-slate-500 mt-1">
            המפתח נשמר בדפדפן בלבד ולא נשלח לשום שרת מלבד Google API.
          </p>
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-lg font-medium text-slate-800 mb-2">
            הדבק את הפוסט והתגובות כאן:
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="העתק לכאן את הטקסט המלא..."
            className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-slate-700"
          />

          <div className="mt-4 flex justify-end">
            <button
              onClick={analyzeText}
              disabled={loading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all
                ${loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <>מנתח נתונים...</>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  נתח רטוריקה
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fadeIn">

            {/* Score Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-slate-500" />
                    ציון מניפולציה וקיטוב
                  </h2>
                  <span className={`text-4xl font-black ${getScoreColor(result.populism_score)}`}>
                    {result.populism_score}/100
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
                  <div
                    className={`h-4 rounded-full transition-all duration-1000 ${getProgressBarColor(result.populism_score)}`}
                    style={{ width: `${result.populism_score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>שיח ענייני</span>
                  <span>פופוליזם מתון</span>
                  <span>דמגוגיה קיצונית</span>
                </div>
              </div>

              <div className="p-6 bg-slate-50">
                <h3 className="font-semibold text-slate-700 mb-2">סיכום המערכת:</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  {result.summary}
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-sm font-medium">
                  <span className="opacity-60 ml-2">טון מזוהה:</span>
                  {result.tone_analysis}
                </div>
              </div>
            </div>

            {/* Tactics Cards */}
            <div className="grid gap-4">
              <h3 className="text-xl font-bold text-slate-800 mr-2">טקטיקות שזוהו ({result.tactics.length}):</h3>

              {result.tactics.length === 0 ? (
                 <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-green-800 flex items-center gap-3">
                   <CheckCircle className="w-6 h-6" />
                   לא נמצאו כשלים רטוריים מובהקים בטקסט זה.
                 </div>
              ) : (
                result.tactics.map((tactic, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-md border-r-4 border-red-500 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-red-500" />
                          <h4 className="font-bold text-lg text-slate-900">{tactic.name}</h4>
                        </div>
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                          ${tactic.severity === 'High' ? 'bg-red-100 text-red-700' :
                            tactic.severity === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}
                        `}>
                          {tactic.severity}
                        </span>
                      </div>

                      <div className="mb-4 bg-slate-50 p-3 rounded-lg border-r-2 border-slate-300 relative">
                        <Quote className="w-4 h-4 text-slate-300 absolute top-2 right-2" />
                        <p className="text-slate-600 italic text-sm pr-6">"{tactic.quote}"</p>
                      </div>

                      <p className="text-slate-700 text-sm leading-relaxed">
                        <span className="font-semibold text-slate-900 ml-1">הניתוח:</span>
                        {tactic.explanation}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RhetoricAnalyzer;