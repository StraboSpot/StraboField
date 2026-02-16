import React from 'react';
import {Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {TERNARY_MINERALS} from './petrology.constants';
import {roundToDecimalPlaces} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import PageHeader from '../page/PageHeader';

const TernaryPage = () => {
  /* Data Hooks / State */

  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const ternary = gatherTernaryValues();

  /* Logic Helpers */

  function gatherTernaryValues() {
    let ternaryTemp = {};
    if (spot.properties.pet && spot.properties.pet.minerals && Array.isArray(spot.properties.pet.minerals)) {
      console.log('Calculating ternary values...');
      Object.entries(TERNARY_MINERALS).forEach(([key, mineralClass]) => {
        const foundMinerals = spot.properties.pet.minerals.filter((mineral) => {
          return (mineral.full_mineral_name && mineralClass.includes(mineral.full_mineral_name.toLowerCase()))
            || mineralClass.includes(mineral.volcanic_mineral)
            || mineralClass.includes(mineral.metamorphic_mineral)
            || mineralClass.includes(mineral.plutonic_mineral)
            || mineralClass.includes(mineral.mineral);
        });
        ternaryTemp[key] = foundMinerals.reduce((acc, mineral) => acc + mineral.modal || 0, 0);
      });
      ternaryTemp.qap_sum = ternaryTemp.q + ternaryTemp.a + ternaryTemp.p;
      ternaryTemp.apf_sum = ternaryTemp.f + ternaryTemp.a + ternaryTemp.p;
      ternaryTemp.ooc_sum = ternaryTemp.ol + ternaryTemp.opx + ternaryTemp.cpx;
      ternaryTemp.ocp_sum = ternaryTemp.ol + ternaryTemp.cpx + ternaryTemp.p;
      ternaryTemp.oph_sum = ternaryTemp.ol + ternaryTemp.pyx + ternaryTemp.hbl;
    }
    return ternaryTemp;
  }

  /* View */

  return (
    <>
      <PageHeader pageTitle={'Ternary'}/>
      {!((ternary.q > 0 && ternary.a > 0 && ternary.p > 0)
          || (ternary.a > 0 && ternary.p > 0 && ternary.f > 0)
          || (ternary.ol > 0 && ternary.opx > 0 && ternary.cpx > 0)
          || (ternary.ol > 0 && ternary.cpx > 0 && ternary.p > 0)
          || (ternary.ol > 0 && ternary.pyx > 0 && ternary.hbl > 0))
        && (
          <View style={{padding: 10}}>
            <Text>
              No calculations to display. Add relevant minerals with modal percents to the Minerals list to calculate
              QAP, APF, Ultramafics (Ol, Opx, Cpx), Ultramafics (Ol, Cpx, Plag) and Ultramafics (Ol, Pyx, Hbl).
            </Text>
          </View>
        )}
      {ternary.q > 0 && ternary.a > 0 && ternary.p > 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>QAP Calculations</ListItem.Title>
            <ListItem.Subtitle style={{color: themes.PRIMARY_TEXT_COLOR}}>
              Q (Quartz): {ternary.q}
              {'\n'}
              A (Alkali Feldspar): {ternary.a}
              {'\n'}
              P (Plagioclase): {ternary.p}
              {'\n'}
              QAP Sum = {ternary.qap_sum}
              {'\n'}
              Normalized Q value = {roundToDecimalPlaces((ternary.q / ternary.qap_sum) * 100, 4)}
              {'\n'}
              Normalized A value = {roundToDecimalPlaces((ternary.a / ternary.qap_sum) * 100, 4)}
              {'\n'}
              Normalized P value = {roundToDecimalPlaces((ternary.p / ternary.qap_sum) * 100, 4)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      )}
      {ternary.a > 0 && ternary.p > 0 && ternary.f > 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>APF Calculations</ListItem.Title>
            <ListItem.Subtitle style={{color: themes.PRIMARY_TEXT_COLOR}}>
              A (Alkali Feldspar): {ternary.a}
              {'\n'}
              P (Plagioclase): {ternary.p}
              {'\n'}
              F (Feldspathoids): {ternary.f}
              {'\n'}
              APF Sum = {ternary.apf_sum}
              {'\n'}
              Normalized A value = {roundToDecimalPlaces((ternary.a / ternary.apf_sum) * 100, 4)}
              {'\n'}
              Normalized P value = {roundToDecimalPlaces((ternary.p / ternary.apf_sum) * 100, 4)}
              {'\n'}
              Normalized F value = {roundToDecimalPlaces((ternary.f / ternary.apf_sum) * 100, 4)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      )}
      {ternary.ol > 0 && ternary.opx > 0 && ternary.cpx > 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>Ultramafics (Ol, Opx, Cpx) Calculations</ListItem.Title>
            <ListItem.Subtitle style={{color: themes.PRIMARY_TEXT_COLOR}}>
              Ol (Olivine): {ternary.ol}
              {'\n'}
              Opx (Orthopyroxene): {ternary.opx}
              {'\n'}
              Cpx (Clinopyroxene): {ternary.cpx}
              {'\n'}
              OOC Sum = {ternary.ooc_sum}
              {'\n'}
              Normalized Ol value = {roundToDecimalPlaces((ternary.ol / ternary.ooc_sum) * 100, 4)}
              {'\n'}
              Normalized Opx value = {roundToDecimalPlaces((ternary.opx / ternary.ooc_sum) * 100, 4)}
              {'\n'}
              Normalized CPx value = {roundToDecimalPlaces((ternary.cpx / ternary.ooc_sum) * 100, 4)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      )}
      {ternary.ol > 0 && ternary.cpx > 0 && ternary.p > 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>Ultramafics (Ol, Cpx, Plag) Calculations</ListItem.Title>
            <ListItem.Subtitle style={{color: themes.PRIMARY_TEXT_COLOR}}>
              Ol (Olivine): {ternary.ol}
              {'\n'}
              Cpx (Clinopyroxene): {ternary.cpx}
              {'\n'}
              Plag (Plagioclase): {ternary.p}
              {'\n'}
              OCP Sum = {ternary.ocp_sum}
              {'\n'}
              Normalized Ol value = {roundToDecimalPlaces((ternary.ol / ternary.ocp_sum) * 100, 4)}
              {'\n'}
              Normalized Cpx value = {roundToDecimalPlaces((ternary.cpx / ternary.ocp_sum) * 100, 4)}
              {'\n'}
              Normalized Plag value = {roundToDecimalPlaces((ternary.p / ternary.ocp_sum) * 100, 4)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      )}
      {ternary.ol > 0 && ternary.pyx > 0 && ternary.hbl > 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title>Ultramafics (Ol, Pyx, Hbl) Calculations</ListItem.Title>
            <ListItem.Subtitle style={{color: themes.PRIMARY_TEXT_COLOR}}>
              Ol (Olivine): {ternary.ol}
              {'\n'}
              Pyx (Pyroxene): {ternary.pyx}
              {'\n'}
              Hbl (Hornblende): {ternary.hbl}
              {'\n'}
              OPH Sum = {ternary.oph_sum}
              {'\n'}
              Normalized Ol value = {roundToDecimalPlaces((ternary.ol / ternary.oph_sum) * 100, 4)}
              {'\n'}
              Normalized Ppx value = {roundToDecimalPlaces((ternary.pyx / ternary.oph_sum) * 100, 4)}
              {'\n'}
              Normalized Hbl value = {roundToDecimalPlaces((ternary.hbl / ternary.oph_sum) * 100, 4)}
            </ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      )}
    </>
  );
};

export default TernaryPage;
