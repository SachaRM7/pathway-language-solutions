from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess,json,hashlib
root=Path('deliverables');review=Path('review');raw=review/'rendered-master.mp4'
def run(args): subprocess.run(args,check=True)
names=[f'Pathway-R3-VIDEO_0{i+1}.mp4' for i in range(3)]
for i,name in enumerate(names):
 run(['ffmpeg','-v','error','-i',str(raw),'-vf',f'trim=start_frame={i*450}:end_frame={(i+1)*450},setpts=PTS-STARTPTS','-an','-c:v','libx264','-crf','20','-preset','fast','-g','30','-bf','0','-r','30','-video_track_timescale','15360','-movflags','+faststart','-y',str(root/name)])
(review/'concat.txt').write_text(''.join("file '../deliverables/"+n+"'\n" for n in names))
joined=review/'DIRECT_CONCAT_45s.mp4'
run(['ffmpeg','-v','error','-f','concat','-safe','0','-i',str(review/'concat.txt'),'-c','copy','-movflags','+faststart','-y',str(joined)])
master=root/'Pathway-R3-MASTER_LONG_FORM.mp4'
# Remove only the last 30 static frames; the rest remains the exact encoded
# pictures from the three individual exports, with no further video encoding.
run(['ffmpeg','-v','error','-i',str(joined),'-frames:v','1320','-c','copy','-movflags','+faststart','-y',str(master)])
def hashes(p):
 lines=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','framemd5','-']).decode().splitlines()
 return [l.split(',')[-1].strip() for l in lines if l and not l.startswith('#')]
parts=[hashes(root/n) for n in names];full=hashes(joined);short=hashes(master)
assert len(full)==1350 and len(short)==1320
assert full==sum(parts,[]) and short==full[:1320]
# Lossy interframe compression may change decoded pixels in a motionless hold.
# Check deterministic source motion, not byte identity across different times.
run(['node','verify-motion.cjs'])
assert json.loads((review/'motion-check.json').read_text())['holdStatic']
info=[]
for file in [master]+[root/n for n in names]:
 r=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]));v=r['streams'][0]
 info.append({'name':file.name,'duration':float(r['format']['duration']),'frames':int(v['nb_frames']),'width':v['width'],'height':v['height'],'fps':v['r_frame_rate'],'audio':any(s['codec_type']=='audio' for s in r['streams']),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
assert [i['frames'] for i in info]==[1320,450,450,450]
assert all(i['width']==1280 and i['height']==720 and not i['audio'] for i in info)
checks={'exports':info,'direct_concatenation_frame_identical':True,'master_equals_first_1320_concatenated_frames':True,'static_final_hold_master_seconds':3,'static_final_hold_video03_seconds':4,'seams_frames':[450,900],'same_global_timeline':True}
(review/'export-check.json').write_text(json.dumps(checks,indent=2));print(json.dumps(checks,indent=2))
for stale in review.glob('t-*.jpg'): stale.unlink()
run(['ffmpeg','-v','error','-i',str(master),'-vf','fps=2,scale=384:216','-y',str(review/'t-%03d.jpg')])
f=ImageFont.truetype('public/DM-Sans-500.ttf',20)
ps=sorted(review.glob('t-*.jpg'))
for j in range(3):
 out=Image.new('RGB',(1536,8*245),'#e6e9df');d=ImageDraw.Draw(out)
 for i,p in enumerate(ps[j*30:(j+1)*30]):
  x=i%4*384;y=i//4*245;out.paste(Image.open(p),(x,y));d.text((x+10,y+220),f'{j*15+i/2:.1f} s',font=f,fill='#122b26')
 out.save(review/f'timeline-{j+1}.jpg',quality=93)
# Exact adjacent exported frames, including frames on either side of each seam.
for frame in [448,449,450,451,898,899,900,901]:
 run(['ffmpeg','-v','error','-i',str(master),'-vf',f'select=eq(n\\,{frame})','-frames:v','1','-y',str(review/f'join-{frame}.png')])
