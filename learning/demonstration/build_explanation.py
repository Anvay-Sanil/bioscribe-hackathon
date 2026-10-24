"""Build the single-page learning handout without changing BioScribe sources."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable, KeepTogether
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'output/pdf/bioscribe-project-demonstration.pdf'
DEST.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Segoe', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeBold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFontFamily('Segoe', normal='Segoe', bold='SegoeBold', italic='Segoe', boldItalic='SegoeBold')
INK, GREEN, MUTED = colors.HexColor('#192d30'), colors.HexColor('#126349'), colors.HexColor('#536569')
body = ParagraphStyle('Body', fontName='Segoe', fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=9)
small = ParagraphStyle('Small', parent=body, fontSize=8.5, leading=11.5, spaceAfter=0)
title = ParagraphStyle('Title', parent=body, fontName='SegoeBold', fontSize=24, leading=29, spaceAfter=6)
eyebrow = ParagraphStyle('Eyebrow', parent=small, fontName='SegoeBold', textColor=GREEN, fontSize=9, spaceAfter=9)

class Pipeline(Flowable):
    def __init__(self):
        super().__init__(); self.width=511; self.height=61
    def draw(self):
        c=self.canv
        labels=[('Input','120 SMILES'),('Calculations','MW / TPSA / QED'),('Ranking','Heuristic / QED'),('Saved report','JSON + metadata'),('Viewer','Inspect + filter')]
        width, gap=91,14
        for index,(heading,detail) in enumerate(labels):
            x=index*(width+gap)
            c.setFillColor(colors.HexColor('#edf4ee')); c.setStrokeColor(colors.HexColor('#d2e2d6'))
            c.roundRect(x,11,width,43,6,fill=1,stroke=1)
            c.setFillColor(GREEN); c.setFont('SegoeBold',9); c.drawCentredString(x+width/2,37,heading)
            c.setFillColor(MUTED); c.setFont('Segoe',7.5); c.drawCentredString(x+width/2,23,detail)
            if index<4:
                c.setStrokeColor(GREEN); c.line(x+width+3,32,x+width+11,32)
                c.line(x+width+8,35,x+width+11,32); c.line(x+width+8,29,x+width+11,32)

story=[Paragraph('BIOSCRIBE / LOCAL LEARNING',eyebrow),Paragraph('From input to an honest report',title),Paragraph('A short project demonstration using example molecules and invented outcome labels.',body)]
banner=Table([[Paragraph('<b>SYNTHETIC LEARNING DATA</b><br/>No assay measurements or biological-performance evidence are represented.',small)]],colWidths=[511])
banner.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#fff4d5')),('BOX',(0,0),(-1,-1),.6,colors.HexColor('#e7c971')),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LEFTPADDING',(0,0),(-1,-1),12)]))
story += [banner,Spacer(1,9),Pipeline(),Spacer(1,3)]
paragraphs=[
 ('1  Input', 'The library contains 120 straight-chain alkanes, identified by SMILES and IDs. Labels are invented: chain lengths divisible by seven are true. One example replaces a true label with null. These are software fixtures, not experimental outcomes.'),
 ('2  Molecular calculations', 'The strict parser accepts concrete graphs. RDKit calculates molecular weight (g/mol), TPSA (square angstroms) and QED. Graph-derived descriptors and calculated scores do not establish activity, affinity or safety.'),
 ('3  Ranking', 'The unvalidated heuristic sorts by ascending abs(MW-350)/350 + abs(TPSA-75)/75; QED sorts descending. A deterministic, label-independent tie-break fixes each order. Each selection uses exactly the requested budget; labels do not choose the order.'),
 ('4  Saved report', 'JSON preserves identities, field metadata, coverage and comparisons. A smaller budget changes selection length, not calculations. With an unknown label, calculations remain available; this exercise withholds selections and aggregate comparisons. Unknown never becomes negative.'),
 ('5  Viewer', 'The local viewer checks values, status, units, method/version and evidence metadata. It makes no web requests. Search and filters change table visibility only. Contradictory metadata rejects the report and clears previous results.'),
]
for heading,text in paragraphs:
    story.append(Paragraph(f'<b>{heading}.</b> {text}',body))
rows=[['DEMONSTRATION','VISIBLE RESULT'],['Budget 100, then 10','120 scored in both; invented positives 14/100 vs 14/100, then 2/10 vs 1/10 (heuristic vs QED).'],['One unknown label','120 scored; selections and comparisons: Not assessed.'],['Find alkane-028, then clear','Showing 1 of 120 molecules, then 120 of 120; comparisons remain Not assessed.'],['Contradictory status or units','Report rejected; previous values cleared.']]
table=Table([[Paragraph(cell,small) for cell in row] for row in rows],colWidths=[150,361],hAlign='LEFT')
table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#edf4ee')),('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#b8c6be')),('LINEBELOW',(0,1),(-1,-1),.4,colors.HexColor('#e0e7df')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),8)]))
story += [Spacer(1,2),table,Spacer(1,12),Paragraph('<b>Key lesson:</b> molecular calculations can succeed while outcome comparisons remain unavailable. This demonstrates software behavior with invented labels. The separate scientific-validation study is unchanged.',body)]
def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor('#dce4df'));canvas.line(42,38,553,38)
    canvas.setFont('Segoe',7.5);canvas.setFillColor(MUTED)
    canvas.drawString(42,25,'BioScribe learning project | Synthetic examples | Local demonstration')
    canvas.drawRightString(553,25,str(doc.page))
doc=SimpleDocTemplate(str(DEST),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=34,bottomMargin=48,title='BioScribe - From input to an honest report',author='BioScribe learning project')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(DEST)
assert len(reader.pages)==1, f'Expected one page, got {len(reader.pages)}'
assert 'Unknown never becomes negative' in reader.pages[0].extract_text()
print(f'Created {DEST}; verified exactly one page.')
