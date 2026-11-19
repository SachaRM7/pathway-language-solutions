from pathlib import Path
import csv,json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path('deliverables');r=list(csv.DictReader((root/'Pathway-R4-motion-data.csv').open()));a={k:np.array([float(x[k]) for x in r]) for k in r[0]}
j=json.loads(Path('review/metrics.json').read_text())
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#122B26','text.color':'#122B26','axes.titleweight':'bold','svg.fonttype':'none'})
terra='#C76F56';green='#122B26';gray='#a3aba7';t=a['t'];mask=t<=42

def decorate(ax, reference=False):
 ax.set_xlim(0,44);ax.set_xticks(np.arange(0,45,2));ax.grid(axis='y',alpha=.16);ax.set_xlabel('Temps du master (secondes)')
 for b in ([15,30] if reference else [15,28]):ax.axvline(b,color=green,ls=':',lw=1,alpha=.45)
 lo,hi=(40.1,44) if reference else (39,42)
 ax.axvspan(lo,hi,color=green,alpha=.065)
 ax.axvline(lo,color=green,ls='--',lw=1,alpha=.55)
 ax.text((lo+hi)/2,1.01,'Maintien final R3' if reference else 'Maintien final R4',ha='center',va='bottom',transform=ax.get_xaxis_transform(),fontsize=9)

fig,ax=plt.subplots(figsize=(13,5.4),layout='constrained')
ax.plot(t,100*a['r3_progress'],color=gray,lw=1.7,label='R3 · paliers successifs')
ax.plot(t[mask],100*a['r4_progress'][mask],color=terra,lw=2.7,label='R4 · intégrale de la vitesse continue')
ax.set_title('Progression du fil — distance parcourue sur le tracé',loc='left',pad=20);ax.set_ylabel('Longueur parcourue (%)');ax.set_ylim(-2,103);decorate(ax);ax.legend(loc='lower right',frameon=False)
fig.savefig(root/'Pathway-R4-progression.png',dpi=150);fig.savefig(root/'Pathway-R4-progression.svg');plt.close(fig)

fig,axs=plt.subplots(2,1,figsize=(13,8),layout='constrained',gridspec_kw={'height_ratios':[1.6,1]})
ax=axs[0];ax.plot(t[mask],a['r4_v'][mask],color=terra,lw=2.6,label='R4 · vitesse sur la longueur du tracé')
ax.axhline(10,color=green,lw=.9,ls='--',alpha=.5);ax.set_ylim(-12,620);ax.set_title('R4 — vitesse positive jusqu’à la résolution finale',loc='left',pad=20);ax.set_ylabel('Vitesse (px source / s)');decorate(ax)
ax.axvline(34.5,color=terra,ls='--',alpha=.55,lw=1);ax.annotate('Décélération finale\n34,5 → 39 s',xy=(35.6,370),xytext=(29.5,550),arrowprops={'arrowstyle':'->','color':green},fontsize=10)
ax.text(18.5,175,f'Minimum avant décélération : {j["min_velocity_before_final_deceleration"]:.1f} px/s',ha='center',va='bottom',fontsize=10)
for b in [15,28]:
 v=float(np.interp(b,t,a['r4_v']));ax.scatter([b],[v],s=24,color=green,zorder=3);ax.annotate(f'{b} s · {v:.0f} px/s',xy=(b,v),xytext=(b,470),ha='center',fontsize=9)
ax=axs[1];ax.plot(t,a['r3_v'],color=gray,lw=1.25);ax.set_ylim(-50,max(a['r3_v'])*1.1);ax.set_title('Référence R3 — 13,95 s de plateaux immobiles avant la fin',loc='left',pad=15);ax.set_ylabel('Vitesse (px source / s)');decorate(ax, reference=True)
for lo,hi in j['r3_full_stops']:ax.axvspan(lo,hi,color=terra,alpha=.12)
fig.savefig(root/'Pathway-R4-vitesse.png',dpi=150);fig.savefig(root/'Pathway-R4-vitesse.svg');plt.close(fig)
