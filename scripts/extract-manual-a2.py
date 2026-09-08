from pathlib import Path
import pymupdf as fitz
from PIL import Image
r=Path('.'); dest=r/'assets/manual-a2';dest.mkdir(parents=True,exist_ok=True)
doc=fitz.open(r/'output/pdf/Manuel A1 Pahtway V.1.pdf')
groups={'table-matieres':[(2,None)],'sommaire':[(3,None),(4,None)],'unite-1':[(i,None) for i in range(5,11)]+[(11,(0,0,595.32,215))], 'examen-a':[(87,(0,638,595.32,841.92))]+[(i,None) for i in range(88,91)]+[(91,(0,0,595.32,200))], 'autoevaluation':[(91,(0,200,595.32,585))]}
manifest={};combined=fitz.open()
for name,pages in groups.items():
 out=fitz.open();items=[]
 for n,clip in pages:
  rect=fitz.Rect(clip) if clip else doc[n-1].rect
  page=out.new_page(width=rect.width,height=rect.height)
  page.show_pdf_page(page.rect,doc,n-1,clip=rect)
  pix=page.get_pixmap(matrix=fitz.Matrix(2,2))
  filename=f'{name}-{n}.webp'
  Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(dest/filename,'WEBP',quality=88)
  items.append((n,filename,pix.width,pix.height))
 combined.insert_pdf(out)
 out.set_metadata({'title':f'Manuel A2 Pathway - {name}','author':'Pathway Language Solutions'})
 out.save(dest/f'{name}.pdf',garbage=4,deflate=True)
 manifest[name]=items
combined.save(dest/'manuel-a2-extraits.pdf',garbage=4,deflate=True)
import json
(r/'tmp').mkdir(exist_ok=True)
(r/'tmp/manual-manifest.json').write_text(json.dumps(manifest),encoding='utf-8')
print('Extracted',sum(len(v) for v in manifest.values()),'pages; MB',sum(p.stat().st_size for p in dest.iterdir())/1e6)
