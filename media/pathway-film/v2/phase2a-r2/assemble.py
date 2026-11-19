from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json
root=Path('deliverables');src=root/'Pathway-R2-prototype-45s.mp4';raw=Path('review/rendered-master.mp4');src.rename(raw)
names=['Pathway-R2-01-institut-15s.mp4','Pathway-R2-02-accompagnement-15s.mp4','Pathway-R2-03-objectif-inscription-15s.mp4']
for i,name in enumerate(names):
 subprocess.run(['ffmpeg','-v','error','-i',str(raw),'-ss',str(i*15),'-t','15','-an','-c:v','libx264','-crf','21','-preset','fast','-r','30','-video_track_timescale','15360','-movflags','+faststart','-y',str(root/name)],check=True)
Path('review/concat.txt').write_text(''.join("file '../deliverables/"+name+"'\n" for name in names))
subprocess.run(['ffmpeg','-v','error','-f','concat','-safe','0','-i','review/concat.txt','-c','copy','-movflags','+faststart','-y',str(src)],check=True)
info=[]
for p in [src]+[root/n for n in names]:
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));v=r['streams'][0]
 info.append({'name':p.name,'duration':r['format']['duration'],'frames':v['nb_frames'],'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'audio':any(s['codec_type']=='audio' for s in r['streams'])})
print(json.dumps(info));Path('review/media-check.json').write_text(json.dumps(info,indent=2))
f=ImageFont.truetype('public/DM-Sans-500.ttf',20)
out=Image.new('RGB',(1440,3*304),'#e6e9df');draw=ImageDraw.Draw(out)
labels=['01 · Pathway et le site','02 · Cours privés en direct','03 · Parcours A1–B2','04 · Matière pédagogique réelle','05 · Accompagnement','06 · Pratique et feedback','07 · Objectif NCLC 7','08 · Point de départ','09 · Marque et action']
for i,p in enumerate(sorted((root/'frames').glob('*.png'))):
 x=i%3*480;y=i//3*304;out.paste(Image.open(p).resize((480,270)),(x,y));draw.text((x+14,y+279),labels[i],font=f,fill='#122b26')
out.save(root/'Pathway-R2-storyboard.jpg',quality=94)
# Decode a timeline and the actual assembly boundaries for review.
subprocess.run(['ffmpeg','-v','error','-i',str(src),'-vf','fps=1,scale=320:180','-y','review/t-%03d.jpg'],check=True)
frames=sorted(Path('review').glob('t-*.jpg'));out=Image.new('RGB',(1600,9*205),'#e6e9df');d=ImageDraw.Draw(out)
for i,p in enumerate(frames):
 x=i%5*320;y=i//5*205;out.paste(Image.open(p),(x,y));d.text((x+10,y+183),str(i)+'s',font=f,fill='#122b26')
out.save('review/timeline.jpg',quality=92)
