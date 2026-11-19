from pathlib import Path
import json,hashlib,subprocess
r=Path('review');o=Path('deliverables');j=json.loads((r/'metrics.json').read_text());f=o/'Pathway-R4-MASTER-FLOW.mp4'
checks=[]
for n in [449,450,451,839,840,841]:
 a=hashlib.sha256((r/f'master-{n}.png').read_bytes()).hexdigest();b=hashlib.sha256((r/f'window-{n}.png').read_bytes()).hexdigest();assert a==b,n;checks.append({'global_frame':n,'same_png_sha256':a})
j['rendered_window_comparison']=checks
j['windows']=[{'id':'WINDOW-01','global_start_frame':0,'frames':450},{'id':'WINDOW-02','global_start_frame':450,'frames':390},{'id':'WINDOW-03','global_start_frame':840,'frames':420}]
a=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]));v=a['streams'][0]
assert int(v['nb_frames'])==1260 and float(a['format']['duration'])==42 and not any(s['codec_type']=='audio' for s in a['streams'])
j['export']={'frames':1260,'fps':30,'duration':42,'width':v['width'],'height':v['height'],'audio':False,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
assert j['exactLogo'] and j['min_velocity_before_final_deceleration']>237
assert len(j['intentional_near_zero'])==1 and j['intentional_near_zero'][0][0]>38
(r/'metrics.json').write_text(json.dumps(j,indent=2)+'\n');(o/'Pathway-R4-verifications.json').write_text(json.dumps(j,indent=2)+'\n')
print(json.dumps({'video':j['export'],'matching_window_frames':len(checks),'near_zero':j['intentional_near_zero']},indent=2))
