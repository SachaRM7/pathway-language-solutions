"""Recompose complete manual sections for balanced reader spreads.
Coordinates refer to the source PDF, not screen pixels. Original PDF is unchanged.
"""
from pathlib import Path
import json
import pymupdf as fitz
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
source=fitz.open(ROOT/'output/pdf/Manuel A1 Pahtway V.1.pdf')
outdir=ROOT/'assets/manual-a2/reader';outdir.mkdir(parents=True,exist_ok=True)
W,H=595.32,841.92
manifest=[]; combined=fitz.open(); groups={}
def block(n,y0,y1,x0=61,x1=535):return(n,(x0,y0,x1,y1))
def paste(page,item,y,width=475,x=60):
 n,coords=item;clip=fitz.Rect(coords);h=clip.height*width/clip.width
 assert y+h<808, (n,y,h)
 page.show_pdf_page(fitz.Rect(x,y,x+width,y+h),source,n-1,clip=clip)
 return y+h

def add(key,title,blocks,sources,gap=20):
 pdf=groups.setdefault(key,fitz.open());p=pdf.new_page(width=W,height=H)
 y=48
 for item in blocks:y=paste(p,item,y)+gap
 finish(p,pdf,key,title,sources)
 return p

def finish(p,pdf,key,title,sources):
 number=len(manifest)+1
 p.draw_line((60,807),(535,807),color=(.83,.86,.82),width=.5)
 p.insert_text((60,822),f'PATHWAY A2  |  Extraits recomposes - source : p. {sources}',fontsize=7,color=(.35,.42,.36))
 p.insert_text((523,822),str(number),fontsize=8,color=(.35,.42,.36))
 pix=p.get_pixmap(matrix=fitz.Matrix(2,2));name=f'{key}-{len(pdf)}.webp'
 Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(outdir/name,quality=91)
 manifest.append({'src':f'/assets/manual-a2/reader/{name}','title':title,'n':number,'source':sources,'key':key})

add('table-matieres','Tabla de contenidos',[block(2,96,722,40,555)],'2')
# Complete A+B on the first page; complete C+D on the second.
add('sommaire','Índice detallado',[block(3,38,559,40,555)],'3')
pdf=groups['sommaire'];p=pdf.new_page(width=W,height=H)
p.insert_text((60,64),'Toutes les unités',fontname='Times-Bold',fontsize=21,color=(.12,.18,.15))
y=paste(p,block(3,580,805,40,555),90)
y=paste(p,block(4,39,281,40,555),y+8)
paste(p,block(4,320,435,40,555),y+26)
finish(p,pdf,'sommaire','Índice detallado','3-4')
add('unite-1','Unidad 1',[block(5,52,804)],'5')
add('unite-1','Unidad 1',[block(6,39,438),block(7,39,310)],'6-7',gap=22)
add('unite-1','Unidad 1',[block(7,319,533),block(8,39,358)],'7-8',gap=28)
add('unite-1','Unidad 1',[block(9,39,744)],'9')
add('unite-1','Unidad 1',[block(10,39,232),block(10,280,575)],'10',gap=28)
add('unite-1','Unidad 1',[block(10,596,702),block(11,39,192),block(97,553,720)],'10-11, 97',gap=26)
# Keep the exam title with its oral task; each reading exercise stays together.
add('examen-a','Examen A',[block(87,643,804),block(88,39,354)],'87-88',gap=0)
add('examen-a','Examen A',[block(89,39,704)],'89')
add('examen-a','Examen A',[block(89,709,804),block(90,39,434)],'89-90',gap=0)
add('examen-a','Examen A',[block(90,455,702),block(91,39,190)],'90-91',gap=28)
add('autoevaluation','Autoevaluación',[block(91,200,568)],'91')
for key,pdf in groups.items():
 pdf.set_metadata({'title':f'Pathway A2 - {key} - lecture','author':'Pathway Language Solutions'})
 pdf.save(outdir/f'{key}.pdf',garbage=4,deflate=True)
 combined.insert_pdf(pdf)
combined.save(outdir/'manuel-a2-extraits.pdf',garbage=4,deflate=True)
(outdir/'pages.js').write_text('window.PathwayManualPages = '+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
(ROOT/'tmp/recomposed-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
print(f'{len(manifest)} balanced pages exported')
